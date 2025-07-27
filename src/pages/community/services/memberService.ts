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
  arrayUnion,
  arrayRemove,
  Unsubscribe,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  DetailedCommunityMember,
  ExtendedUserReference,
  CustomRole,
  CustomPermission,
  MemberSearchFilters,
  MemberStatsResponse,
  MemberSummary
} from '../types/member.types';
import type { CommunityRole, MemberStatus } from '../types/community.types';
import type { PaginationParams } from '../types/common.types';

/**
 * MemberService: Real-time, type-safe, advanced service for managing community members.
 */
export class MemberService {
  private static instance: MemberService;
  private readonly COMMUNITIES_COLLECTION = 'communities';
  private readonly MEMBERS_SUBCOLLECTION = 'members';
  private activeListeners: Map<string, Unsubscribe> = new Map();

  private constructor() {}
  public static getInstance(): MemberService {
    if (!MemberService.instance) {
      MemberService.instance = new MemberService();
    }
    return MemberService.instance;
  }

  /**
   * Add a new member to a community
   */
  async addMember(
    communityId: string,
    member: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'>,
    addedBy: string
  ): Promise<string> {
    try {
      const membersRef = collection(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION);
      const now = serverTimestamp();
      const docRef = doc(membersRef, member.userId);
      const memberData: Omit<DetailedCommunityMember, 'id'> = {
        ...member,
        createdAt: now as Timestamp,
        updatedAt: now as Timestamp,
        createdBy: addedBy,
        updatedBy: addedBy
      };
      await setDoc(docRef, memberData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding member:', error);
      throw new Error('Failed to add member');
    }
  }

  /**
   * Update a member's details
   */
  async updateMember(
    communityId: string,
    memberId: string,
    updates: Partial<DetailedCommunityMember>,
    updatedBy: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error('Failed to update member');
    }
  }

  /**
   * Remove a member from a community
   */
  async removeMember(
    communityId: string,
    memberId: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  /**
   * Get a member by ID
   */
  async getMemberById(
    communityId: string,
    memberId: string
  ): Promise<DetailedCommunityMember | null> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      const snapshot = await getDoc(memberRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as DetailedCommunityMember;
    } catch (error) {
      console.error('Error getting member by ID:', error);
      throw new Error('Failed to get member');
    }
  }

  /**
   * List members of a community with optional filters and pagination
   */
  async listMembers(
    communityId: string,
    filters: MemberSearchFilters = {},
    pagination: PaginationParams = { limit: 20 },
    sortOptions?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<{ members: DetailedCommunityMember[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot }> {
    try {
      let q = query(collection(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION));
      // Apply filters (example: role, status, skills, etc.)
      if (filters.roles && filters.roles.length > 0) {
        q = query(q, where('role', 'in', filters.roles));
      }
      if (filters.statuses && filters.statuses.length > 0) {
        q = query(q, where('status', 'in', filters.statuses));
      }
      if (filters.skills && filters.skills.length > 0) {
        q = query(q, where('userDetails.skills', 'array-contains-any', filters.skills));
      }
      if (filters.isOnline !== undefined) {
        q = query(q, where('isOnline', '==', filters.isOnline));
      }
      // Sorting
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      } else {
        q = query(q, orderBy('joinedAt', 'desc'));
      }
      // Pagination
      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }
      q = query(q, limit(pagination.limit + 1));
      // Fetch
      const snapshot = await getDocs(q);
      const members: DetailedCommunityMember[] = [];
      snapshot.docs.forEach((doc, idx) => {
        if (idx < pagination.limit) {
          members.push({ id: doc.id, ...doc.data() } as DetailedCommunityMember);
        }
      });
      return {
        members,
        hasMore: snapshot.docs.length > pagination.limit,
        lastDoc: snapshot.docs[pagination.limit - 1]
      };
    } catch (error) {
      console.error('Error listing members:', error);
      throw new Error('Failed to list members');
    }
  }

  /**
   * Real-time subscribe to a single member
   */
  subscribeToMember(
    communityId: string,
    memberId: string,
    callback: (member: DetailedCommunityMember | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
    return onSnapshot(
      memberRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
        } else {
          callback({ id: snapshot.id, ...snapshot.data() } as DetailedCommunityMember);
        }
      },
      onError
    );
  }

  /**
   * Real-time subscribe to all members in a community (with filters)
   */
  subscribeToMembers(
    communityId: string,
    filters: MemberSearchFilters = {},
    callback: (members: DetailedCommunityMember[]) => void,
    onError?: (error: FirestoreError) => void,
    sortOptions?: { field: string; direction: 'asc' | 'desc' }
  ): Unsubscribe {
    let q = query(collection(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION));
    if (filters.roles && filters.roles.length > 0) {
      q = query(q, where('role', 'in', filters.roles));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      q = query(q, where('status', 'in', filters.statuses));
    }
    if (filters.skills && filters.skills.length > 0) {
      q = query(q, where('userDetails.skills', 'array-contains-any', filters.skills));
    }
    if (filters.isOnline !== undefined) {
      q = query(q, where('isOnline', '==', filters.isOnline));
    }
    if (sortOptions) {
      q = query(q, orderBy(sortOptions.field, sortOptions.direction));
    } else {
      q = query(q, orderBy('joinedAt', 'desc'));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const members: DetailedCommunityMember[] = [];
        snapshot.forEach(doc => {
          members.push({ id: doc.id, ...doc.data() } as DetailedCommunityMember);
        });
        callback(members);
      },
      onError
    );
  }

  /**
   * Change a member's role
   */
  async changeMemberRole(
    communityId: string,
    memberId: string,
    newRole: CommunityRole,
    updatedBy: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await updateDoc(memberRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error changing member role:', error);
      throw new Error('Failed to change member role');
    }
  }

  /**
   * Change a member's status (e.g., suspend, ban, activate)
   */
  async changeMemberStatus(
    communityId: string,
    memberId: string,
    newStatus: MemberStatus,
    updatedBy: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await updateDoc(memberRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error changing member status:', error);
      throw new Error('Failed to change member status');
    }
  }

  /**
   * Grant a custom permission to a member
   */
  async grantPermission(
    communityId: string,
    memberId: string,
    permission: CustomPermission,
    updatedBy: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await updateDoc(memberRef, {
        customPermissions: arrayUnion(permission),
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error granting permission:', error);
      throw new Error('Failed to grant permission');
    }
  }

  /**
   * Revoke a custom permission from a member
   */
  async revokePermission(
    communityId: string,
    memberId: string,
    permissionId: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const member = await this.getMemberById(communityId, memberId);
      if (!member) throw new Error('Member not found');
      const updatedPermissions = member.customPermissions.filter(p => p.id !== permissionId);
      const memberRef = doc(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION, memberId);
      await updateDoc(memberRef, {
        customPermissions: updatedPermissions,
        updatedAt: serverTimestamp(),
        updatedBy
      });
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw new Error('Failed to revoke permission');
    }
  }

  /**
   * Get member stats (basic)
   */
  async getMemberStats(
    communityId: string,
    memberId: string
  ): Promise<MemberStatsResponse | null> {
    try {
      // This is a placeholder. You can extend this to fetch stats from analytics collections.
      const member = await this.getMemberById(communityId, memberId);
      if (!member) return null;
      return {
        totalMembers: 1,
        activeMembers: member.status === 'active' ? 1 : 0,
        onlineMembers: member.isOnline ? 1 : 0,
        newThisWeek: 0,
        newThisMonth: 0,
        topContributors: [],
        engagementStats: {
          averageMessagesPerDay: member.activityMetrics.averageMessagesPerDay,
          averageSessionDuration: member.activityMetrics.averageSessionDuration,
          mostActiveHours: [],
          mostActiveDays: [],
          retentionRate: 0,
          churnRate: 0
        },
        timestamp: member.updatedAt
      };
    } catch (error) {
      console.error('Error getting member stats:', error);
      return null;
    }
  }

  /**
   * Join a community directly (for public communities or approved requests)
   */
  async joinCommunity(
    user: { uid: string; displayName?: string; email?: string; photoURL?: string },
    communityId: string
  ): Promise<void> {
    try {
      const memberData: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        userDetails: {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || '',
          skills: [],
          bio: '',
          location: '',
          website: '',
          socialLinks: {}
        },
        role: 'member',
        status: 'active',
        joinedAt: serverTimestamp() as Timestamp,
        lastSeenAt: serverTimestamp() as Timestamp,
        isOnline: true,
        activityMetrics: {
          totalMessages: 0,
          totalReactions: 0,
          totalEventsAttended: 0,
          averageMessagesPerDay: 0,
          averageSessionDuration: 0,
          lastActivityAt: serverTimestamp() as Timestamp
        },
        permissions: [],
        customPermissions: [],
        badges: [],
        joinMethod: 'direct',
        createdBy: user.uid,
        updatedBy: user.uid
      };

      await this.addMember(communityId, memberData, user.uid);
    } catch (error) {
      console.error('Error joining community:', error);
      throw new Error('Failed to join community');
    }
  }

  /**
   * Request to join a community (for private communities)
   */
  async requestToJoinCommunity(
    user: { uid: string; displayName?: string; email?: string; photoURL?: string },
    communityId: string
  ): Promise<void> {
    try {
      const memberData: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        userDetails: {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || '',
          skills: [],
          bio: '',
          location: '',
          website: '',
          socialLinks: {}
        },
        role: 'member',
        status: 'pending',
        joinedAt: serverTimestamp() as Timestamp,
        lastSeenAt: serverTimestamp() as Timestamp,
        isOnline: false,
        activityMetrics: {
          totalMessages: 0,
          totalReactions: 0,
          totalEventsAttended: 0,
          averageMessagesPerDay: 0,
          averageSessionDuration: 0,
          lastActivityAt: serverTimestamp() as Timestamp
        },
        permissions: [],
        customPermissions: [],
        badges: [],
        joinMethod: 'request',
        createdBy: user.uid,
        updatedBy: user.uid
      };

      await this.addMember(communityId, memberData, user.uid);
    } catch (error) {
      console.error('Error requesting to join community:', error);
      throw new Error('Failed to request to join community');
    }
  }

  /**
   * Leave a community
   */
  async leaveCommunity(
    userId: string,
    communityId: string
  ): Promise<void> {
    try {
      // First, find the member by userId
      const membersRef = collection(db, this.COMMUNITIES_COLLECTION, communityId, this.MEMBERS_SUBCOLLECTION);
      const q = query(membersRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Member not found in community');
      }

      // Get the member document ID
      const memberDoc = snapshot.docs[0];
      await this.removeMember(communityId, memberDoc.id);
    } catch (error) {
      console.error('Error leaving community:', error);
      throw new Error('Failed to leave community');
    }
  }
}
