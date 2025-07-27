// useCommunityMembers.ts
// Placeholder for useCommunityMembers hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  DetailedCommunityMember,
  MemberSearchFilters,
  MemberStatsResponse,
  CustomPermission
} from '../types/member.types';
import type { CommunityRole, MemberStatus } from '../types/community.types';
import { MemberService } from '../services/memberService';
import type { FirestoreError, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * useCommunityMembers - Real-time, advanced hook for managing community members.
 * @param communityId - The community ID to subscribe to members.
 * @param options - Optional filters, pagination, and sort options.
 * @returns Member state, real-time members, and member actions.
 */
export function useCommunityMembers(
  communityId: string,
  options?: {
    filters?: MemberSearchFilters;
    sortOptions?: { field: string; direction: 'asc' | 'desc' };
  }
) {
  const [members, setMembers] = useState<DetailedCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time subscription to members
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = MemberService.getInstance().subscribeToMembers(
      communityId,
      options?.filters || {},
      (mems) => {
        setMembers(mems);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      options?.sortOptions
    );
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, JSON.stringify(options?.filters), JSON.stringify(options?.sortOptions)]);

  // Add a new member
  const addMember = useCallback(
    async (member: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'>, addedBy: string) => {
      return MemberService.getInstance().addMember(communityId, member, addedBy);
    },
    [communityId]
  );

  // Update a member
  const updateMember = useCallback(
    async (memberId: string, updates: Partial<DetailedCommunityMember>, updatedBy: string) => {
      return MemberService.getInstance().updateMember(communityId, memberId, updates, updatedBy);
    },
    [communityId]
  );

  // Remove a member
  const removeMember = useCallback(
    async (memberId: string) => {
      return MemberService.getInstance().removeMember(communityId, memberId);
    },
    [communityId]
  );

  // Change member role
  const changeMemberRole = useCallback(
    async (memberId: string, newRole: CommunityRole, updatedBy: string) => {
      return MemberService.getInstance().changeMemberRole(communityId, memberId, newRole, updatedBy);
    },
    [communityId]
  );

  // Change member status
  const changeMemberStatus = useCallback(
    async (memberId: string, newStatus: MemberStatus, updatedBy: string) => {
      return MemberService.getInstance().changeMemberStatus(communityId, memberId, newStatus, updatedBy);
    },
    [communityId]
  );

  // Grant permission
  const grantPermission = useCallback(
    async (memberId: string, permission: CustomPermission, updatedBy: string) => {
      return MemberService.getInstance().grantPermission(communityId, memberId, permission, updatedBy);
    },
    [communityId]
  );

  // Revoke permission
  const revokePermission = useCallback(
    async (memberId: string, permissionId: string, updatedBy: string) => {
      return MemberService.getInstance().revokePermission(communityId, memberId, permissionId, updatedBy);
    },
    [communityId]
  );

  // Get member stats
  const getMemberStats = useCallback(
    async (memberId: string) => {
      return MemberService.getInstance().getMemberStats(communityId, memberId);
    },
    [communityId]
  );

  // Pagination support (fetch more members)
  const fetchMoreMembers = useCallback(
    async (pagination: { limit: number; startAfter?: QueryDocumentSnapshot }, filters?: MemberSearchFilters, sortOptions?: { field: string; direction: 'asc' | 'desc' }) => {
      return MemberService.getInstance().listMembers(communityId, filters, pagination, sortOptions);
    },
    [communityId]
  );

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    changeMemberRole,
    changeMemberStatus,
    grantPermission,
    revokePermission,
    getMemberStats,
    fetchMoreMembers
  };
} 