// searchHelpers.ts
// Advanced, Firestore-compliant search helpers for the community platform

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Query,
    Firestore,
    DocumentData
  } from 'firebase/firestore';
  import type {
    Community,
    CommunityFilter
  } from '../types/community.types';
  import type {
    DetailedCommunityMember,
    MemberSearchFilters
  } from '../types/member.types';
  import type {
    ChatMessage,
    ChatSearchParams
  } from '../types/chat.types';
  import type {
    Resource,
    ResourceSearchRequest
  } from '../types/resource.types';
  import type {
    PaginationParams,
    SearchFilter,
    SortOption,
    SearchResult
  } from '../types/common.types';
  
  // --- Query Builders ---
  
  export function buildCommunityQuery(
    db: Firestore,
    filter: CommunityFilter = {},
    pagination: PaginationParams = { limit: 20 }
  ): Query<DocumentData> {
    let q: Query<DocumentData> = query(collection(db, 'communities'));
    if (filter.categories && filter.categories.length > 0) {
      q = query(q, where('category', 'in', filter.categories));
    }
    if (filter.tags && filter.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filter.tags));
    }
    if (filter.isActive !== undefined) {
      q = query(q, where('isActive', '==', filter.isActive));
    }
    if (filter.sortBy) {
      q = query(q, orderBy(filter.sortBy, filter.sortOrder || 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    if (pagination.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }
    q = query(q, limit(pagination.limit));
    return q;
  }
  
  export function buildMemberQuery(
    db: Firestore,
    communityId: string,
    filters: MemberSearchFilters = {},
    pagination: PaginationParams = { limit: 20 }
  ): Query<DocumentData> {
    let q: Query<DocumentData> = query(collection(db, 'communityMembers'));
    q = query(q, where('communityId', '==', communityId));
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
    q = query(q, orderBy('joinedAt', 'desc'));
    if (pagination.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }
    q = query(q, limit(pagination.limit));
    return q;
  }
  
  export function buildChatQuery(
    db: Firestore,
    params: ChatSearchParams,
    pagination: PaginationParams = { limit: 20 }
  ): Query<DocumentData> {
    let q: Query<DocumentData> = query(collection(db, 'chatMessages'));
    if (params.communityId) {
      q = query(q, where('communityId', '==', params.communityId));
    }
    if (params.authorId) {
      q = query(q, where('authorId', '==', params.authorId));
    }
    if (params.messageType) {
      q = query(q, where('type', '==', params.messageType));
    }
    if (params.hasAttachments) {
      q = query(q, where('attachments', '!=', []));
    }
    if (params.tags && params.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', params.tags));
    }
    if (params.sortBy) {
      q = query(q, orderBy(params.sortBy, params.sortOrder || 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    if (pagination.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }
    q = query(q, limit(pagination.limit));
    return q;
  }
  
  export function buildResourceQuery(
    db: Firestore,
    params: ResourceSearchRequest,
    pagination: PaginationParams = { limit: 20 }
  ): Query<DocumentData> {
    let q: Query<DocumentData> = query(collection(db, 'resources'));
    if (params.communityId) {
      q = query(q, where('communityId', '==', params.communityId));
    }
    if (params.type) {
      q = query(q, where('type', '==', params.type));
    }
    if (params.category) {
      q = query(q, where('category', '==', params.category));
    }
    if (params.tags && params.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', params.tags));
    }
    if (params.sortBy) {
      q = query(q, orderBy(params.sortBy, 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    if (pagination.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }
    q = query(q, limit(pagination.limit));
    return q;
  }
  
  // --- Filter/Sort Utilities ---
  
  export function normalizeSortOption(sort?: SortOption): { field: string; direction: 'asc' | 'desc' } {
    return {
      field: sort?.field || 'createdAt',
      direction: sort?.direction || 'desc',
    };
  }
  
  export function validateSearchFilter(filter: SearchFilter): boolean {
    // Basic validation for Firestore-supported operators
    const allowedOperators = [
      'equals', 'not_equals', 'greater_than', 'less_than',
      'contains', 'starts_with', 'in', 'not_in', 'array_contains'
    ];
    return allowedOperators.includes(filter.operator);
  }
  
  // --- Result Formatters ---
  
  export function formatSearchResult<T>(result: T): T {
    // Placeholder for result formatting/highlighting (extend as needed)
    return result;
  }
  
  // --- Pagination Helpers ---
  
  export function getNextPageParams<T>(
    lastDoc: T | undefined,
    limit: number
  ): PaginationParams {
    return {
      limit,
      startAfter: lastDoc,
    };
  }
  
  // --- Index/Rule Compliance ---
  
  export function checkIndexCompliance(
    sortBy: string,
    filters: string[]
  ): boolean {
    // Example: Ensure composite index exists for sortBy + filters
    // (In production, this should check against a config or known index list)
    // Here, always return true for demo purposes
    return true;
  }
  
  // --- Type Guards ---
  
  export function isSearchResult<T>(obj: unknown): obj is SearchResult<T> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'results' in obj &&
      'totalCount' in obj &&
      'searchTime' in obj
    );
  }
  
  // --- Real-time Subscription Helpers ---
  
  export function cleanupSubscription(unsubRef: React.MutableRefObject<(() => void) | null>) {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }
  