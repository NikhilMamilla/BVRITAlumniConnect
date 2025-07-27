import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  Community,
  CommunityRule,
  CommunityFeatures,
  CommunitySettings,
  CommunityFilter,
  CommunityStats,
  CommunityAnalytics,
  CreateCommunityData,
  UpdateCommunityData,
  RecentActivity,
  CommunityInvitation,
  CommunityMember,
  CommunityWithLastMessage,
} from '../types/community.types';
import type { PaginationParams, UserReference, UserRole } from '../types/common.types';

/**
 * CommunityService: Real-time, type-safe, advanced service for managing communities.
 */
export class CommunityService {
  private static instance: CommunityService;
  private readonly COMMUNITIES_COLLECTION = 'communities';
  private readonly INVITATIONS_COLLECTION = 'communityInvitations';
  private activeListeners: Map<string, Unsubscribe> = new Map();

  private constructor() {}
  public static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  /**
   * Create a new community (atomic, type-safe)
   */
  async createCommunity(
    data: CreateCommunityData,
    owner: { id: string; name: string; email: string; avatar?: string; role: string }
  ): Promise<string> {
    const communityRef = doc(collection(db, this.COMMUNITIES_COLLECTION));
    
    await runTransaction(db, async (transaction) => {
        const now = serverTimestamp();
        const slug = this.generateSlug(data.name);

        const communityData: Omit<Community, 'id' | 'createdAt' | 'updatedAt'> = {
            name: data.name,
            slug,
            description: data.description,
            longDescription: data.longDescription || '',
            avatar: data.avatar || '',
            banner: data.banner || '',
            color: data.color || '',
            emoji: data.emoji || '',
            category: data.category,
            tags: data.tags || [],
            skills: data.skills || [],
            visibility: data.visibility,
            joinApproval: data.joinApproval,
            memberLimit: data.memberLimit || 0,
            allowInvites: true,
            allowResourceSharing: true,
            allowEvents: true,
            guidelines: data.guidelines || '',
            rules: [],
            welcomeMessage: data.welcomeMessage || '',
            owner: { id: owner.id, name: owner.name, email: owner.email, avatar: owner.avatar, role: owner.role as UserRole },
            moderators: [],
            admins: [owner.id],
            status: 'active',
            memberCount: 1,
            activeMembers: 1,
            messageCount: 0,
            discussionCount: 0,
            resourceCount: 0,
            eventCount: 0,
            engagementScore: 0,
            growthRate: 0,
            lastActivity: now as Timestamp,
            features: { ...data.features } as CommunityFeatures,
            settings: { ...data.settings } as CommunitySettings,
            moderationStatus: 'approved',
            flagCount: 0,
            searchKeywords: this.generateSearchKeywords(data.name, data.tags),
            isArchived: false,
            onlineMembers: 0,
            recentActivity: [],
            createdBy: owner.id,
            updatedBy: owner.id,
            privacy: data.visibility === 'public' ? 'public' : 'private',
        };
        transaction.set(communityRef, {
            ...communityData,
            createdAt: now,
            updatedAt: now,
        });

        const memberRef = doc(db, 'communityMembers', `${owner.id}_${communityRef.id}`);
        transaction.set(memberRef, {
            userId: owner.id,
            communityId: communityRef.id,
            role: 'owner',
            status: 'active',
            joinedAt: now,
            userDetails: { name: owner.name, email: owner.email, avatar: owner.avatar }
        });
    });

    return communityRef.id;
  }

  /**
   * Update a community (atomic, type-safe)
   */
  async updateCommunity(
    communityId: string,
    updates: UpdateCommunityData,
    updatedBy: string
  ): Promise<void> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy
      };
      await updateDoc(communityRef, updateData);
    } catch (error) {
      console.error('Error updating community:', error);
      throw new Error('Failed to update community');
    }
  }

  /**
   * Delete a community (soft delete, can be restored)
   */
  async deleteCommunity(communityId: string, deletedBy: string, reason?: string): Promise<void> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      await updateDoc(communityRef, {
        status: 'archived',
        isArchived: true,
        archiveReason: reason || 'Deleted by admin',
        updatedAt: serverTimestamp(),
        updatedBy: deletedBy
      });
    } catch (error) {
      console.error('Error deleting community:', error);
      throw new Error('Failed to delete community');
    }
  }

  /**
   * Restore an archived community
   */
  async restoreCommunity(communityId: string, restoredBy: string): Promise<void> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      await updateDoc(communityRef, {
        status: 'active',
        isArchived: false,
        archiveReason: null,
        updatedAt: serverTimestamp(),
        updatedBy: restoredBy
      });
    } catch (error) {
      console.error('Error restoring community:', error);
      throw new Error('Failed to restore community');
    }
  }

  /**
   * Get a community by ID
   */
  async getCommunityById(communityId: string): Promise<Community | null> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      const snapshot = await getDoc(communityRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Community;
    } catch (error) {
      console.error('Error getting community by ID:', error);
      throw new Error('Failed to get community');
    }
  }

  /**
   * Get a community by slug or ID
   */
  async getCommunityBySlug(slugOrId: string): Promise<Community | null> {
    try {
      // Try by slug first
      const q = query(
        collection(db, this.COMMUNITIES_COLLECTION),
        where('slug', '==', slugOrId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Community;
      }
      // If not found by slug, try by ID
      const byId = await this.getCommunityById(slugOrId);
      if (byId) return byId;
      return null;
    } catch (error) {
      console.error('Error getting community by slug or ID:', error);
      throw new Error('Failed to get community');
    }
  }

  /**
   * Get multiple communities by their IDs
   */
  async getCommunitiesByIds(communityIds: string[]): Promise<Community[]> {
    if (communityIds.length === 0) {
      return [];
    }
    try {
      const q = query(
        collection(db, this.COMMUNITIES_COLLECTION),
        where('__name__', 'in', communityIds)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
    } catch (error) {
      console.error('Error getting communities by IDs:', error);
      throw new Error('Failed to get communities');
    }
  }

  /**
   * Get a list of communities with advanced filtering, sorting, and pagination
   */
  async getCommunities(
    filter: CommunityFilter = {},
    pagination: PaginationParams = { limit: 20 }
  ): Promise<{ communities: Community[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot }>
  {
    try {
      let q = query(collection(db, this.COMMUNITIES_COLLECTION));
      // Apply filters
      if (filter.categories && filter.categories.length > 0) {
        q = query(q, where('category', 'in', filter.categories));
      }
      if (filter.tags && filter.tags.length > 0) {
        q = query(q, where('tags', 'array-contains-any', filter.tags));
      }
      if (filter.isActive !== undefined) {
        q = query(q, where('status', '==', filter.isActive ? 'active' : 'inactive'));
      }
      if (filter.includeArchived === false) {
        q = query(q, where('isArchived', '==', false));
      }
      if (filter.createdBy) {
        q = query(q, where('createdBy', '==', filter.createdBy));
      }
      if (filter.memberCount) {
        if (filter.memberCount.min !== undefined) {
          q = query(q, where('memberCount', '>=', filter.memberCount.min));
        }
        if (filter.memberCount.max !== undefined) {
          q = query(q, where('memberCount', '<=', filter.memberCount.max));
        }
      }
      // Sorting - removed to avoid index issues, will sort in JavaScript
      // if (filter.sortBy) {
      //   q = query(q, orderBy(filter.sortBy, filter.sortOrder || 'desc'));
      // } else {
      //   q = query(q, orderBy('lastActivity', 'desc'));
      // }
      // Pagination
      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }
      q = query(q, limit(pagination.limit + 1));
      // Fetch
      const snapshot = await getDocs(q);
      const communities: Community[] = [];
      snapshot.docs.forEach((doc, idx) => {
        if (idx < pagination.limit) {
          communities.push({ id: doc.id, ...doc.data() } as Community);
        }
      });
      
      // Sort in JavaScript
      communities.sort((a, b) => {
        if (filter.sortBy) {
          const aVal = a[filter.sortBy as keyof Community];
          const bVal = b[filter.sortBy as keyof Community];
          if (filter.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        } else {
          // Default sort by lastActivity
          const aDate = a.lastActivity?.toDate?.() || new Date();
          const bDate = b.lastActivity?.toDate?.() || new Date();
          return bDate.getTime() - aDate.getTime();
        }
      });
      
      return {
        communities,
        hasMore: snapshot.docs.length > pagination.limit,
        lastDoc: snapshot.docs[pagination.limit - 1]
      };
    } catch (error) {
      console.error('Error getting communities:', error);
      throw new Error('Failed to fetch communities');
    }
  }

  /**
   * Real-time subscribe to a community document
   */
  subscribeToCommunity(
    communityId: string,
    callback: (community: Community | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
    return onSnapshot(
      communityRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
        } else {
          callback({ id: snapshot.id, ...snapshot.data() } as Community);
        }
      },
      onError
    );
  }

  /**
   * Real-time subscribe to a list of communities (with filters)
   */
  subscribeToCommunities(
    filter: CommunityFilter,
    callback: (communities: Community[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    let q = query(collection(db, this.COMMUNITIES_COLLECTION));
    if (filter.categories && filter.categories.length > 0) {
      q = query(q, where('category', 'in', filter.categories));
    }
    if (filter.tags && filter.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filter.tags));
    }
    if (filter.isActive !== undefined) {
      q = query(q, where('status', '==', filter.isActive ? 'active' : 'inactive'));
    }
    if (filter.includeArchived === false) {
      q = query(q, where('isArchived', '==', false));
    }
    if (filter.createdBy) {
      q = query(q, where('createdBy', '==', filter.createdBy));
    }
    if (filter.memberCount) {
      if (filter.memberCount.min !== undefined) {
        q = query(q, where('memberCount', '>=', filter.memberCount.min));
      }
      if (filter.memberCount.max !== undefined) {
        q = query(q, where('memberCount', '<=', filter.memberCount.max));
      }
    }
    // Sorting removed to avoid index issues
    // if (filter.sortBy) {
    //   q = query(q, orderBy(filter.sortBy, filter.sortOrder || 'desc'));
    // } else {
    //   q = query(q, orderBy('lastActivity', 'desc'));
    // }
    return onSnapshot(
      q,
      (snapshot) => {
        const communities: Community[] = [];
        snapshot.forEach(doc => {
          communities.push({ id: doc.id, ...doc.data() } as Community);
        });
        
        // Sort in JavaScript
        communities.sort((a, b) => {
          if (filter.sortBy) {
            const aVal = a[filter.sortBy as keyof Community];
            const bVal = b[filter.sortBy as keyof Community];
            if (filter.sortOrder === 'asc') {
              return aVal > bVal ? 1 : -1;
            } else {
              return aVal < bVal ? 1 : -1;
            }
          } else {
            // Default sort by lastActivity
            const aDate = a.lastActivity?.toDate?.() || new Date();
            const bDate = b.lastActivity?.toDate?.() || new Date();
            return bDate.getTime() - aDate.getTime();
          }
        });
        
        callback(communities);
      },
      onError
    );
  }

  /**
   * Add a rule to a community
   */
  async addCommunityRule(
    communityId: string,
    rule: CommunityRule,
    updatedBy: string
  ): Promise<void> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      await updateDoc(communityRef, {
        rules: arrayUnion(rule),
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error adding community rule:', error);
      throw new Error('Failed to add rule');
    }
  }

  /**
   * Remove a rule from a community
   */
  async removeCommunityRule(
    communityId: string,
    ruleId: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const community = await this.getCommunityById(communityId);
      if (!community) throw new Error('Community not found');
      const updatedRules = community.rules.filter(r => r.id !== ruleId);
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      await updateDoc(communityRef, {
        rules: updatedRules,
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error removing community rule:', error);
      throw new Error('Failed to remove rule');
    }
  }

  /**
   * Add recent activity to a community (for real-time feed)
   */
  async addRecentActivity(
    communityId: string,
    activity: RecentActivity
  ): Promise<void> {
    try {
      const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
      await updateDoc(communityRef, {
        recentActivity: arrayUnion(activity),
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding recent activity:', error);
      throw new Error('Failed to add activity');
    }
  }

  /**
   * Get community stats (basic)
   */
  async getCommunityStats(communityId: string): Promise<CommunityStats> {
    const communityRef = doc(db, this.COMMUNITIES_COLLECTION, communityId);
    const communitySnap = await getDoc(communityRef);

    if (!communitySnap.exists()) {
      throw new Error('Community not found');
    }

    const community = communitySnap.data() as unknown as Community;

    // These would typically be calculated or aggregated, but we'll use dummy data for now
    return {
      totalMembers: community.memberCount || 0,
      activeMembers: community.activeMembers || 0,
      messages: community.messageCount || 0,
      totalDiscussions: community.discussionCount || 0,
      totalResources: community.resourceCount || 0,
      totalEvents: community.eventCount || 0,
      engagementRate: community.engagementScore || 0,
      growthRate: community.growthRate || 0,
      retentionRate: 0, // Would need to be calculated
      averageMessageLength: 0, // Would need to be calculated
      peakOnlineMembers: community.onlineMembers || 0,
      lastUpdated: community.lastActivity || Timestamp.now(),
      settings: community.settings || {}
    };
  }

  /**
   * Get community analytics (advanced, if available)
   */
  async getCommunityAnalytics(communityId: string): Promise<CommunityAnalytics | null> {
    try {
      const analyticsRef = doc(db, 'communityAnalytics', communityId);
      const snapshot = await getDoc(analyticsRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as CommunityAnalytics;
    } catch (error) {
      console.error('Error getting community analytics:', error);
      return null;
    }
  }

  /**
   * Utility: Generate a slug from a community name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 50);
  }

  /**
   * Utility: Generate search keywords for a community
   */
  generateSearchKeywords(name: string, tags: string[]): string[] {
    const keywords = new Set<string>();
    name
      .toLowerCase()
      .split(/\s+/)
      .forEach(word => keywords.add(word));
    tags.forEach(tag => keywords.add(tag.toLowerCase()));
    return Array.from(keywords);
  }
}
