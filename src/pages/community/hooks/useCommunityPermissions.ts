// useCommunityPermissions.ts
// Placeholder for useCommunityPermissions hook

import { useEffect, useState } from 'react';
import type { DetailedCommunityMember } from '../types/member.types';
import type { Community } from '../types/community.types';
import { MemberService } from '../services/memberService';
import { CommunityService } from '../services/communityService';
import type { FirestoreError } from 'firebase/firestore';

/**
 * useCommunityPermissions - Real-time, advanced hook for checking user permissions/roles in a community.
 * @param communityId - The community ID.
 * @param userId - The user ID.
 * @returns Permission state, real-time member data, and role/permission checks.
 */
export function useCommunityPermissions(
  communityId: string,
  userId: string
) {
  const [member, setMember] = useState<DetailedCommunityMember | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Real-time subscription to member document
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId || !userId) {
      setMember(null);
      setCommunity(null);
      setLoading(false);
      return;
    }
    const unsubMember = MemberService.getInstance().subscribeToMember(
      communityId,
      userId,
      (mem) => {
        setMember(mem);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    // Optionally fetch community info
    CommunityService.getInstance().getCommunityById(communityId)
      .then(setCommunity)
      .catch(() => setCommunity(null));
    return () => {
      unsubMember();
    };
  }, [communityId, userId]);

  // Permission/role checks
  const isMember = !!member && member.status === 'active';
  const isModerator = !!member && ['moderator', 'admin'].includes(member.role);
  const isAdmin = !!member && member.role === 'admin';
  const isOwner = !!community && community.owner?.id === userId;
  const isBanned = !!member && member.status === 'banned';
  const role = member?.role || null;
  const permissions = member?.permissions || [];

  return {
    member,
    community,
    loading,
    error,
    isMember,
    isModerator,
    isAdmin,
    isOwner,
    isBanned,
    role,
    permissions
  };
} 