// CommunityContext.tsx
// Placeholder for CommunityContext

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type {
  Community,
  CommunityFilter,
  CreateCommunityData,
  UpdateCommunityData,
  CommunityRole,
  MemberStatus
} from '../types/community.types';
import type { DetailedCommunityMember, MemberSearchFilters, CustomPermission } from '../types/member.types';
import type { CommunityAnalytics, AnalyticsPeriod } from '../types/analytics.types';
import type { FirestoreError, QueryDocumentSnapshot } from 'firebase/firestore';
import { CommunityService } from '../services/communityService';
import { MemberService } from '../services/memberService';
import { AnalyticsService } from '../services/analyticsService';
import { useAuth } from '@/AuthContext';

// ==================== CONTEXT TYPE ====================
export interface CommunityContextType {
  // Current Community
  currentCommunity: Community | null;
  setCurrentCommunityId: (id: string | null) => void;
  loadingCommunity: boolean;
  communityError: FirestoreError | null;

  // Communities List
  communities: Community[];
  loadingCommunities: boolean;
  communitiesError: FirestoreError | null;
  fetchMoreCommunities: (
    filter?: CommunityFilter,
    pagination?: { limit: number; startAfter?: QueryDocumentSnapshot }
  ) => Promise<{ communities: Community[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot }>;

  // Membership & Permissions
  currentMember: DetailedCommunityMember | null;
  loadingMember: boolean;
  memberError: FirestoreError | null;
  isMember: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isBanned: boolean;
  role: CommunityRole | null;
  permissions: string[];

  // Members List
  members: DetailedCommunityMember[];
  loadingMembers: boolean;
  membersError: FirestoreError | null;
  fetchMoreMembers: (
    pagination: { limit: number; startAfter?: QueryDocumentSnapshot },
    filters?: MemberSearchFilters,
    sortOptions?: { field: string; direction: 'asc' | 'desc' }
  ) => Promise<{ members: DetailedCommunityMember[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot }>;

  // Analytics
  analytics: CommunityAnalytics[];
  loadingAnalytics: boolean;
  analyticsError: FirestoreError | null;
  fetchCommunityAnalytics: (period: AnalyticsPeriod, start: Date, end: Date) => Promise<CommunityAnalytics[]>;

  // Actions
  createCommunity: (data: CreateCommunityData, owner: { id: string; name: string; email: string; avatar?: string; role: string }) => Promise<string>;
  updateCommunity: (communityId: string, updates: UpdateCommunityData, updatedBy: string) => Promise<void>;
  deleteCommunity: (communityId: string, deletedBy: string, reason?: string) => Promise<void>;
  restoreCommunity: (communityId: string, restoredBy: string) => Promise<void>;
  addMember: (member: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'>, addedBy: string) => Promise<string>;
  updateMember: (memberId: string, updates: Partial<DetailedCommunityMember>, updatedBy: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  changeMemberRole: (
    memberId: string,
    newRole: CommunityRole,
    updatedBy: string
  ) => Promise<void>;
  changeMemberStatus: (
    memberId: string,
    newStatus: MemberStatus,
    updatedBy: string
  ) => Promise<void>;
  grantPermission: (memberId: string, permission: CustomPermission, updatedBy: string) => Promise<void>;
  revokePermission: (memberId: string, permissionId: string, updatedBy: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  
  // Current community state
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<FirestoreError | null>(null);
  const communityUnsubRef = useRef<(() => void) | null>(null);

  // Communities list state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [communitiesError, setCommunitiesError] = useState<FirestoreError | null>(null);
  const communitiesUnsubRef = useRef<(() => void) | null>(null);

  // Current member state
  const [currentMember, setCurrentMember] = useState<DetailedCommunityMember | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [memberError, setMemberError] = useState<FirestoreError | null>(null);
  const memberUnsubRef = useRef<(() => void) | null>(null);

  // Members list state
  const [members, setMembers] = useState<DetailedCommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<FirestoreError | null>(null);
  const membersUnsubRef = useRef<(() => void) | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<CommunityAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<FirestoreError | null>(null);

  // Real-time subscription to current community
  useEffect(() => {
    setLoadingCommunity(true);
    setCommunityError(null);
    communityUnsubRef.current?.();
    if (!currentCommunityId) {
      setCurrentCommunity(null);
      setLoadingCommunity(false);
      return;
    }
    communityUnsubRef.current = CommunityService.getInstance().subscribeToCommunity(
      currentCommunityId,
      (community) => {
        setCurrentCommunity(community);
        setLoadingCommunity(false);
      },
      (err) => {
        setCommunityError(err);
        setLoadingCommunity(false);
      }
    );
    return () => {
      communityUnsubRef.current?.();
    };
  }, [currentCommunityId]);

  // Real-time subscription to all communities
  useEffect(() => {
    setLoadingCommunities(true);
    setCommunitiesError(null);
    communitiesUnsubRef.current?.();
    communitiesUnsubRef.current = CommunityService.getInstance().subscribeToCommunities(
      {},
      (comms) => {
        setCommunities(comms);
        setLoadingCommunities(false);
      },
      (err) => {
        setCommunitiesError(err);
        setLoadingCommunities(false);
      }
    );
    return () => {
      communitiesUnsubRef.current?.();
    };
  }, []);

  // Real-time subscription to current member (now using AuthContext)
  useEffect(() => {
    setLoadingMember(true);
    setMemberError(null);
    memberUnsubRef.current?.();
    if (!currentCommunityId || !currentUser?.uid) {
      setCurrentMember(null);
      setLoadingMember(false);
      return;
    }
    memberUnsubRef.current = MemberService.getInstance().subscribeToMember(
      currentCommunityId,
      currentUser.uid,
      (mem) => {
        setCurrentMember(mem);
        setLoadingMember(false);
      },
      (err) => {
        setMemberError(err);
        setLoadingMember(false);
      }
    );
    return () => {
      memberUnsubRef.current?.();
    };
  }, [currentCommunityId, currentUser?.uid]);

  // Real-time subscription to all members in current community
  useEffect(() => {
    setLoadingMembers(true);
    setMembersError(null);
    membersUnsubRef.current?.();
    if (!currentCommunityId) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }
    membersUnsubRef.current = MemberService.getInstance().subscribeToMembers(
      currentCommunityId,
      {},
      (mems) => {
        setMembers(mems);
        setLoadingMembers(false);
      },
      (err) => {
        setMembersError(err);
        setLoadingMembers(false);
      }
    );
    return () => {
      membersUnsubRef.current?.();
    };
  }, [currentCommunityId]);

  // Analytics (on-demand fetch)
  const fetchCommunityAnalytics = useCallback(async (period: AnalyticsPeriod, start: Date, end: Date) => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const analytics = await AnalyticsService.getInstance().getCommunityAnalytics(currentCommunityId!, period, start, end);
      setAnalytics(analytics);
      return analytics;
    } catch (err: unknown) {
      setAnalyticsError(err as FirestoreError);
      return [];
    } finally {
      setLoadingAnalytics(false);
    }
  }, [currentCommunityId]);

  // Community actions
  const fetchMoreCommunities = useCallback(async (filter: CommunityFilter = {}, pagination?: { limit: number; startAfter?: QueryDocumentSnapshot }) => {
    return CommunityService.getInstance().getCommunities(filter, pagination);
  }, []);
  const createCommunity = useCallback(async (data: CreateCommunityData, owner: { id: string; name: string; email: string; avatar?: string; role: string }) => {
    return CommunityService.getInstance().createCommunity(data, owner);
  }, []);
  const updateCommunity = useCallback(async (communityId: string, updates: UpdateCommunityData, updatedBy: string) => {
    return CommunityService.getInstance().updateCommunity(communityId, updates, updatedBy);
  }, []);
  const deleteCommunity = useCallback(async (communityId: string, deletedBy: string, reason?: string) => {
    return CommunityService.getInstance().deleteCommunity(communityId, deletedBy, reason);
  }, []);
  const restoreCommunity = useCallback(async (communityId: string, restoredBy: string) => {
    return CommunityService.getInstance().restoreCommunity(communityId, restoredBy);
  }, []);

  // Member actions
  const addMember = useCallback(async (member: Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'>, addedBy: string) => {
    return MemberService.getInstance().addMember(currentCommunityId!, member, addedBy);
  }, [currentCommunityId]);
  const updateMember = useCallback(async (memberId: string, updates: Partial<DetailedCommunityMember>, updatedBy: string) => {
    return MemberService.getInstance().updateMember(currentCommunityId!, memberId, updates, updatedBy);
  }, [currentCommunityId]);
  const removeMember = useCallback(async (memberId: string) => {
    return MemberService.getInstance().removeMember(currentCommunityId!, memberId);
  }, [currentCommunityId]);
  const fetchMoreMembers = useCallback(async (pagination: { limit: number; startAfter?: QueryDocumentSnapshot }, filters?: MemberSearchFilters, sortOptions?: { field: string; direction: 'asc' | 'desc' }) => {
    return MemberService.getInstance().listMembers(currentCommunityId!, filters || {}, pagination, sortOptions);
  }, [currentCommunityId]);
  const changeMemberRole = useCallback(async (memberId: string, newRole: CommunityRole, updatedBy: string) => {
    return MemberService.getInstance().changeMemberRole(currentCommunityId!, memberId, newRole, updatedBy);
  }, [currentCommunityId]);
  const changeMemberStatus = useCallback(async (memberId: string, newStatus: MemberStatus, updatedBy: string) => {
    return MemberService.getInstance().changeMemberStatus(currentCommunityId!, memberId, newStatus, updatedBy);
  }, [currentCommunityId]);
  const grantPermission = useCallback(async (memberId: string, permission: CustomPermission, updatedBy: string) => {
    return MemberService.getInstance().grantPermission(currentCommunityId!, memberId, permission, updatedBy);
  }, [currentCommunityId]);
  const revokePermission = useCallback(async (memberId: string, permissionId: string, updatedBy: string) => {
    return MemberService.getInstance().revokePermission(currentCommunityId!, memberId, permissionId, updatedBy);
  }, [currentCommunityId]);

  // Role/permission helpers
  const isMember = !!currentMember && ['member', 'contributor', 'moderator', 'admin', 'owner', 'alumni_mentor'].includes(currentMember.role);
  const isModerator = !!currentMember && currentMember.role === 'moderator';
  const isAdmin = !!currentMember && currentMember.role === 'admin';
  const isOwner = !!currentMember && currentMember.role === 'owner';
  const isBanned = !!currentMember && currentMember.status === 'banned';
  const role = currentMember?.role || null;
  const permissions = currentMember?.permissions?.map(p => p.action) || [];

  const value: CommunityContextType = {
    currentCommunity,
    setCurrentCommunityId,
    loadingCommunity,
    communityError,
    communities,
    loadingCommunities,
    communitiesError,
    fetchMoreCommunities,
    currentMember,
    loadingMember,
    memberError,
    isMember,
    isModerator,
    isAdmin,
    isOwner,
    isBanned,
    role,
    permissions,
    members,
    loadingMembers,
    membersError,
    fetchMoreMembers,
    analytics,
    loadingAnalytics,
    analyticsError,
    fetchCommunityAnalytics,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    restoreCommunity,
    addMember,
    updateMember,
    removeMember,
    changeMemberRole,
    changeMemberStatus,
    grantPermission,
    revokePermission
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export function useCommunityContext() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunityContext must be used within a CommunityProvider');
  return ctx;
}
