// useCommunities.ts
// Placeholder for useCommunities hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  Community,
  CommunityFilter,
  CreateCommunityData,
  UpdateCommunityData
} from '../types/community.types';
import { CommunityService } from '../services/communityService';
import type { FirestoreError, QueryDocumentSnapshot } from 'firebase/firestore';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';

const communityService = CommunityService.getInstance();

/**
 * useCommunities - Real-time, advanced hook for managing and listing communities.
 * @param filter - Community filter options.
 * @param options - Optional sort and pagination options.
 * @returns Community state, real-time communities, and community actions.
 */
export function useCommunities(
  filter: CommunityFilter = {},
  options?: {
    sortOptions?: { field: string; direction: 'asc' | 'desc' };
    pagination?: { limit: number; startAfter?: QueryDocumentSnapshot };
  }
) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time subscription to communities
  useEffect(() => {
    setLoading(true);
    setError(null);
    unsubscribeRef.current?.();
    unsubscribeRef.current = communityService.subscribeToCommunities(
      filter,
      (comms) => {
        setCommunities(comms);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter)]);

  // Get a community by ID
  const getCommunityById = useCallback(async (communityId: string) => {
    return communityService.getCommunityById(communityId);
  }, []);

  // Get a community by slug
  const getCommunityBySlug = useCallback(async (slug: string) => {
    return communityService.getCommunityBySlug(slug);
  }, []);

  // Create a new community
  const createCommunity = useCallback(async (data: CreateCommunityData, owner: { id: string; name: string; email: string; avatar?: string; role: string }) => {
    return communityService.createCommunity(data, owner);
  }, []);

  // Update a community
  const updateCommunity = useCallback(async (communityId: string, updates: UpdateCommunityData, updatedBy: string) => {
    return communityService.updateCommunity(communityId, updates, updatedBy);
  }, []);

  // Delete a community
  const deleteCommunity = useCallback(async (communityId: string, deletedBy: string, reason?: string) => {
    return communityService.deleteCommunity(communityId, deletedBy, reason);
  }, []);

  // Restore a community
  const restoreCommunity = useCallback(async (communityId: string, restoredBy: string) => {
    return communityService.restoreCommunity(communityId, restoredBy);
  }, []);

  // Pagination support (fetch more communities)
  const fetchMoreCommunities = useCallback(async (filter: CommunityFilter = {}, pagination: { limit: number; startAfter?: QueryDocumentSnapshot }) => {
    return communityService.getCommunities(filter, pagination);
  }, []);

  return {
    communities,
    loading,
    error,
    getCommunityById,
    getCommunityBySlug,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    restoreCommunity,
    fetchMoreCommunities
  };
} 