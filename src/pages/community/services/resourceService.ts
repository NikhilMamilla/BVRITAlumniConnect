// resourceService.ts
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
  Unsubscribe,
  FirestoreError,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  ResourceCategory,
  ResourceStatus,
  ApprovalStatus,
  type Resource,
  type CreateResourceRequest,
  type UpdateResourceRequest,
  type ResourceCategoryInfo,
  type LinkPreview,
  type ResourceComment,
  type ResourceBookmark,
  type ResourceDownload,
  type ResourceReportReason,
  type ResourceModerationAction,
  type ResourceStatsResponse,
  type ResourceVisibility,
  type ResourceType,
} from '../types/resource.types';

export class ResourceService {
  private static instance: ResourceService;
  private readonly RESOURCES_COLLECTION = 'resources';
  private readonly COMMENTS_COLLECTION = 'resourceComments';
  private readonly BOOKMARKS_COLLECTION = 'resourceBookmarks';
  private readonly DOWNLOADS_COLLECTION = 'resourceDownloads';
  private readonly REPORTS_COLLECTION = 'resourceReports';

  private constructor() {}
  public static getInstance(): ResourceService {
    if (!ResourceService.instance) {
      ResourceService.instance = new ResourceService();
    }
    return ResourceService.instance;
  }

  /**
   * Get resources for a community (with filters, sorting, pagination)
   */
  async getResources(
    communityId: string,
    filters: {
      status?: ResourceStatus[];
      type?: ResourceType[];
      category?: ResourceCategory[];
      visibility?: ResourceVisibility[];
      search?: string;
    } = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    limitCount: number = 20,
    startAfterDoc?: unknown
  ): Promise<Resource[]> {
    let q = query(collection(db, this.RESOURCES_COLLECTION), where('communityId', '==', communityId));
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    if (filters.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }
    if (filters.visibility && filters.visibility.length > 0) {
      q = query(q, where('visibility', 'in', filters.visibility));
    }
    q = query(q, orderBy(sortBy, sortOrder), limit(limitCount));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  }

  /**
   * Real-time subscribe to resources for a community
   */
  subscribeToResources(
    communityId: string,
    callback: (resources: Resource[]) => void,
    onError?: (error: FirestoreError) => void,
    filters: {
      status?: ResourceStatus[];
      type?: ResourceType[];
      category?: ResourceCategory[];
      visibility?: ResourceVisibility[];
    } = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Unsubscribe {
    let q = query(collection(db, this.RESOURCES_COLLECTION), where('communityId', '==', communityId));
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    if (filters.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }
    if (filters.visibility && filters.visibility.length > 0) {
      q = query(q, where('visibility', 'in', filters.visibility));
    }
    q = query(q, orderBy(sortBy, sortOrder));
    return onSnapshot(
      q,
      (snapshot) => {
        const resources: Resource[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        callback(resources);
      },
      onError
    );
  }

  /**
   * Get a single resource by ID
   */
  async getResourceById(resourceId: string): Promise<Resource | null> {
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Resource;
  }

  /**
   * Get all resource categories for a community
   */
  async getResourceCategories(communityId: string): Promise<ResourceCategoryInfo[]> {
    // This is a mock implementation. In a real app, you'd fetch this from a 'resourceCategories' collection.
    const categories: ResourceCategoryInfo[] = Object.values(ResourceCategory).map((name, index) => ({
      id: `cat_${index}`,
      name: name,
      description: `Resources related to ${name}`,
      communityId: communityId,
      level: 0,
      isActive: true,
      allowUploads: true,
      requiresApproval: false,
      createdBy: 'system',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
    return Promise.resolve(categories);
  }

  /**
   * Get a preview for a link (mock implementation)
   */
  async getLinkPreview(url: string): Promise<LinkPreview> {
    console.log(`Fetching link preview for: ${url}`);
    // In a real app, you would use a backend service to fetch metadata from the URL
    // to avoid CORS issues and for security.
    return Promise.resolve({
      url: url,
      title: 'Mock Link Title - BVRIT Hyderabad',
      description: 'This is a mock description for the link provided. A real preview would show the actual page summary.',
      image: 'https://www.bvrit.ac.in/images/slider/11.jpg',
      favicon: 'https://www.bvrit.ac.in/images/favicon.png',
      siteName: 'bvrit.ac.in'
    });
  }

  /**
   * Create a new resource (must comply with Firestore rules)
   */
  async createResource(data: CreateResourceRequest & { uploadedBy: string; uploaderName: string; uploaderRole: 'student' | 'alumni'; uploaderAvatar?: string; isApproved?: boolean; }): Promise<string> {
    const resource: Partial<Resource> = {
      ...data,
      status: data.isApproved ? ResourceStatus.APPROVED : ResourceStatus.PENDING,
      approvalStatus: data.isApproved ? ApprovalStatus.AUTO_APPROVED : ApprovalStatus.PENDING_REVIEW,
      uploadedBy: data.uploadedBy,
      uploaderName: data.uploaderName,
      uploaderRole: data.uploaderRole,
      uploaderAvatar: data.uploaderAvatar,
      downloadCount: 0,
      viewCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
      shareCount: 0,
      version: '1.0.0',
      isLatestVersion: true,
      isEditable: true,
      allowComments: data.allowComments ?? true,
      isFeatured: false,
      isPinned: false,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    const docRef = await addDoc(collection(db, this.RESOURCES_COLLECTION), resource);
    return docRef.id;
  }

  /**
   * Update a resource (must comply with Firestore rules)
   */
  async updateResource(data: UpdateResourceRequest & { updatedBy: string }): Promise<void> {
    const { id, ...updates } = data;
    const ref = doc(db, this.RESOURCES_COLLECTION, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete a resource (must comply with Firestore rules)
   */
  async deleteResource(resourceId: string): Promise<void> {
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await deleteDoc(ref);
  }

  /**
   * Approve a resource (moderator action)
   */
  async approveResource(resourceId: string, moderatorId: string, notes?: string): Promise<void> {
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, {
      status: 'approved',
      approvalStatus: 'manually_approved',
      approvedBy: moderatorId,
      approvedAt: serverTimestamp(),
      reviewNotes: notes ?? '',
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Reject a resource (moderator action)
   */
  async rejectResource(resourceId: string, moderatorId: string, reason: string): Promise<void> {
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, {
      status: 'rejected',
      approvalStatus: 'requires_changes',
      approvedBy: moderatorId,
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Archive a resource (moderator action)
   */
  async archiveResource(resourceId: string, moderatorId: string): Promise<void> {
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, {
      status: 'archived',
      updatedAt: serverTimestamp(),
      approvedBy: moderatorId
    });
  }

  // =========================
  // Resource Engagement
  // =========================

  /**
   * Download a resource (track download)
   */
  async trackDownload(resourceId: string, userId: string, communityId: string, method: 'direct' | 'stream' | 'view', userAgent?: string, ipAddress?: string): Promise<void> {
    await addDoc(collection(db, this.DOWNLOADS_COLLECTION), {
      resourceId,
      userId,
      communityId,
      downloadMethod: method,
      userAgent,
      ipAddress,
      downloadedAt: serverTimestamp()
    });
    // Optionally increment downloadCount
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, { downloadCount: (await getDoc(ref)).data()?.downloadCount + 1 || 1 });
  }

  /**
   * Bookmark a resource
   */
  async bookmarkResource(resourceId: string, userId: string, communityId: string, collectionName?: string, tags?: string[], personalNotes?: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.BOOKMARKS_COLLECTION), {
      resourceId,
      userId,
      communityId,
      collectionName,
      tags,
      personalNotes,
      createdAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp()
    });
    // Optionally increment bookmarkCount
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, { bookmarkCount: (await getDoc(ref)).data()?.bookmarkCount + 1 || 1 });
    return docRef.id;
  }

  /**
   * Like a resource
   */
  async likeResource(resourceId: string, userId: string): Promise<void> {
    // For simplicity, use a subcollection or a separate collection for likes
    const likeRef = doc(collection(db, this.RESOURCES_COLLECTION, resourceId, 'likes'), userId);
    await updateDoc(likeRef, { likedAt: serverTimestamp() });
    // Optionally increment likeCount
    const ref = doc(db, this.RESOURCES_COLLECTION, resourceId);
    await updateDoc(ref, { likeCount: (await getDoc(ref)).data()?.likeCount + 1 || 1 });
  }

  /**
   * Report a resource
   */
  async reportResource(resourceId: string, reportedBy: string, reporterName: string, reporterRole: 'student' | 'alumni', reason: ResourceReportReason, description: string, category: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.REPORTS_COLLECTION), {
      resourceId,
      reportedBy,
      reporterName,
      reporterRole,
      reason,
      description,
      category,
      status: 'pending',
      priority: 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // =========================
  // Resource Stats/Analytics
  // =========================

  /**
   * Get resource stats for a community
   */
  async getResourceStats(communityId: string): Promise<ResourceStatsResponse> {
    // This is a simplified version; for advanced analytics, use a Cloud Function or aggregation
    const q = query(collection(db, this.RESOURCES_COLLECTION), where('communityId', '==', communityId));
    const snapshot = await getDocs(q);
    const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
    const totalResources = resources.length;
    const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
    const totalViews = resources.reduce((sum, r) => sum + (r.viewCount || 0), 0);
    const resourcesByType = resources.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {} as Record<ResourceType, number>);
    const resourcesByCategory = resources.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {} as Record<ResourceCategory, number>);
    const topResources = [...resources].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5);
    const recentUploads = [...resources].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).slice(0, 5);
    return {
      totalResources,
      totalDownloads,
      totalViews,
      resourcesByType,
      resourcesByCategory,
      topResources,
      recentUploads
    };
  }
}

export const resourceService = ResourceService.getInstance();
