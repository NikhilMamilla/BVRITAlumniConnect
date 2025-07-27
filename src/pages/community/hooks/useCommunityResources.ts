// useCommunityResources.ts
// Placeholder for useCommunityResources hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  Resource,
  ResourceStatus,
  ResourceType,
  ResourceCategory,
  ResourceVisibility,
  ApprovalStatus,
  ResourceComment,
  ResourceBookmark,
  ResourceDownload,
  ResourceReportReason,
  ResourceModerationAction,
  ResourceStatsResponse,
  CreateResourceRequest,
  UpdateResourceRequest
} from '../types/resource.types';
import { resourceService } from '../services/resourceService';
import type { FirestoreError } from 'firebase/firestore';

/**
 * useCommunityResources - Real-time, advanced hook for managing community resources.
 * @param communityId - The community ID to subscribe to resources.
 * @param options - Optional filters, sort, and pagination options.
 * @returns Resource state, real-time resources, and resource actions.
 */
export function useCommunityResources(
  communityId: string,
  options?: {
    filters?: {
      status?: ResourceStatus[];
      type?: ResourceType[];
      category?: ResourceCategory[];
      visibility?: ResourceVisibility[];
      search?: string;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limitCount?: number;
  }
) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time subscription to resources
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId) {
      setResources([]);
      setLoading(false);
      return;
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = resourceService.subscribeToResources(
      communityId,
      (res) => {
        setResources(res);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      options?.filters,
      options?.sortBy,
      options?.sortOrder
    );
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, JSON.stringify(options?.filters), options?.sortBy, options?.sortOrder]);

  // Create a new resource
  const createResource = useCallback(
    async (data: CreateResourceRequest & { uploadedBy: string; uploaderName: string; uploaderRole: 'student' | 'alumni'; uploaderAvatar?: string; isApproved?: boolean; }) => {
      return resourceService.createResource(data);
    },
    []
  );

  // Update a resource
  const updateResource = useCallback(
    async (data: UpdateResourceRequest & { updatedBy: string }) => {
      return resourceService.updateResource(data);
    },
    []
  );

  // Delete a resource
  const deleteResource = useCallback(
    async (resourceId: string) => {
      return resourceService.deleteResource(resourceId);
    },
    []
  );

  // Approve a resource
  const approveResource = useCallback(
    async (resourceId: string, moderatorId: string, notes?: string) => {
      return resourceService.approveResource(resourceId, moderatorId, notes);
    },
    []
  );

  // Reject a resource
  const rejectResource = useCallback(
    async (resourceId: string, moderatorId: string, reason: string) => {
      return resourceService.rejectResource(resourceId, moderatorId, reason);
    },
    []
  );

  // Archive a resource
  const archiveResource = useCallback(
    async (resourceId: string, moderatorId: string) => {
      return resourceService.archiveResource(resourceId, moderatorId);
    },
    []
  );

  // Bookmark a resource
  const bookmarkResource = useCallback(
    async (resourceId: string, userId: string, communityId: string, collectionName?: string, tags?: string[], personalNotes?: string) => {
      return resourceService.bookmarkResource(resourceId, userId, communityId, collectionName, tags, personalNotes);
    },
    []
  );

  // Like a resource
  const likeResource = useCallback(
    async (resourceId: string, userId: string) => {
      return resourceService.likeResource(resourceId, userId);
    },
    []
  );

  // Report a resource
  const reportResource = useCallback(
    async (resourceId: string, reportedBy: string, reporterName: string, reporterRole: 'student' | 'alumni', reason: ResourceReportReason, description: string, category: string) => {
      return resourceService.reportResource(resourceId, reportedBy, reporterName, reporterRole, reason, description, category);
    },
    []
  );

  // Download a resource (track download)
  const trackDownload = useCallback(
    async (resourceId: string, userId: string, communityId: string, method: 'direct' | 'stream' | 'view', userAgent?: string, ipAddress?: string) => {
      return resourceService.trackDownload(resourceId, userId, communityId, method, userAgent, ipAddress);
    },
    []
  );

  // Get resource stats
  const getResourceStats = useCallback(
    async (communityId: string) => {
      return resourceService.getResourceStats(communityId);
    },
    []
  );

  // Pagination support (fetch more resources)
  const fetchMoreResources = useCallback(
    async (communityId: string, filters?: { status?: ResourceStatus[]; type?: ResourceType[]; category?: ResourceCategory[]; visibility?: ResourceVisibility[]; search?: string; }, sortBy?: string, sortOrder?: 'asc' | 'desc', limitCount?: number, startAfterDoc?: unknown) => {
      return resourceService.getResources(communityId, filters, sortBy, sortOrder, limitCount, startAfterDoc);
    },
    []
  );

  return {
    resources,
    loading,
    error,
    createResource,
    updateResource,
    deleteResource,
    approveResource,
    rejectResource,
    archiveResource,
    bookmarkResource,
    likeResource,
    reportResource,
    trackDownload,
    getResourceStats,
    fetchMoreResources
  };
} 