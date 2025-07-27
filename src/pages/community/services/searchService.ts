// searchService.ts
// Placeholder for searchService

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  FirestoreError,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Community, CommunityFilter } from '../types/community.types';
import type { DetailedCommunityMember, MemberSearchFilters } from '../types/member.types';
import type { ChatMessage, ChatSearchParams, ChatSearchResult } from '../types/chat.types';
import type { Resource, ResourceSearchRequest } from '../types/resource.types';
import type { PaginationParams, SearchParams, SearchResult } from '../types/common.types';
import { Discussion, DiscussionSearchParams } from '../types/discussion.types';

export class SearchService {
  private static instance: SearchService;
  private readonly COMMUNITIES_COLLECTION = 'communities';
  private readonly MEMBERS_COLLECTION = 'communityMembers';
  private readonly CHAT_MESSAGES_COLLECTION = 'chatMessages';
  private readonly RESOURCES_COLLECTION = 'resources';
  private readonly DISCUSSIONS_COLLECTION = 'discussions';

  private constructor() {}
  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  // For suggestions, we'll do a simpler, non-real-time fetch
  async getSearchSuggestions(searchQuery: string, limitCount: number = 5): Promise<Community[]> {
    if (!searchQuery) {
      return [];
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    
    // In a real-world scenario with a large dataset, this should be handled by a dedicated search service 
    // like Algolia or by using a denormalized lowercase field in Firestore for prefix matching.
    // For this project's scale, we'll filter from a broader query.
    const allCommunitiesQuery = query(collection(db, this.COMMUNITIES_COLLECTION), limit(100));
    const snapshot = await getDocs(allCommunitiesQuery);
    const allCommunities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Community));

    const filtered = allCommunities.filter(community => 
        community.name.toLowerCase().includes(lowercasedQuery)
    ).slice(0, limitCount);

    return filtered;
  }

  // --- COMMUNITY SEARCH ---
  async searchCommunities(
    filter: CommunityFilter = {},
    pagination: PaginationParams = { limit: 20 }
  ): Promise<SearchResult<Community>> {
    let q = query(collection(db, this.COMMUNITIES_COLLECTION));
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
    const start = Date.now();
    const snapshot = await getDocs(q);
    const results: Community[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Community));
    return {
      results,
      totalCount: results.length,
      searchTime: Date.now() - start
    };
  }

  subscribeToCommunities(
    filter: CommunityFilter = {},
    searchQuery: string = '',
    callback: (results: Community[]) => void,
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
      q = query(q, where('isActive', '==', filter.isActive));
    }
    if (filter.sortBy) {
      q = query(q, orderBy(filter.sortBy, filter.sortOrder || 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        let results: Community[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Community));
        
        if (searchQuery) {
          const lowercasedQuery = searchQuery.toLowerCase();
          results = results.filter(community => 
            community.name.toLowerCase().includes(lowercasedQuery) ||
            community.description.toLowerCase().includes(lowercasedQuery)
          );
        }

        // Client-side filtering for join type due to Firestore query constraints (only one 'in' filter allowed)
        if (filter.joinType && filter.joinType.length > 0) {
          results = results.filter(community => filter.joinType!.includes(community.joinApproval));
        }

        callback(results);
      },
      onError
    );
  }

  // --- MEMBER SEARCH ---
  async searchMembers(
    communityId: string,
    filters: MemberSearchFilters = {},
    pagination: PaginationParams = { limit: 20 }
  ): Promise<SearchResult<DetailedCommunityMember>> {
    let q = query(collection(db, this.MEMBERS_COLLECTION));
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
    const start = Date.now();
    const snapshot = await getDocs(q);
    const results: DetailedCommunityMember[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DetailedCommunityMember));
    return {
      results,
      totalCount: results.length,
      searchTime: Date.now() - start
    };
  }

  subscribeToMembers(
    communityId: string,
    filters: MemberSearchFilters = {},
    callback: (results: DetailedCommunityMember[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    let q = query(collection(db, this.MEMBERS_COLLECTION));
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
    return onSnapshot(
      q,
      (snapshot) => {
        const results: DetailedCommunityMember[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DetailedCommunityMember));
        callback(results);
      },
      onError
    );
  }

  // --- CHAT MESSAGE SEARCH ---
  async searchChatMessages(
    params: ChatSearchParams,
    pagination: PaginationParams = { limit: 20 }
  ): Promise<SearchResult<ChatMessage>> {
    let q = query(collection(db, this.CHAT_MESSAGES_COLLECTION));
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
    const start = Date.now();
    const snapshot = await getDocs(q);
    const results: ChatMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ChatMessage));
    return {
      results,
      totalCount: results.length,
      searchTime: Date.now() - start
    };
  }

  subscribeToChatMessages(
    params: ChatSearchParams,
    callback: (results: ChatMessage[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    let q = query(collection(db, this.CHAT_MESSAGES_COLLECTION));
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
    return onSnapshot(
      q,
      (snapshot) => {
        const results: ChatMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ChatMessage));
        callback(results);
      },
      onError
    );
  }

  // --- RESOURCE SEARCH ---
  async searchResources(
    params: ResourceSearchRequest,
    pagination: PaginationParams = { limit: 20 }
  ): Promise<SearchResult<Resource>> {
    let q = query(collection(db, this.RESOURCES_COLLECTION));
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
    if (params.difficulty) {
      q = query(q, where('difficulty', '==', params.difficulty));
    }
    if (params.uploaderRole) {
      q = query(q, where('uploaderRole', '==', params.uploaderRole));
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
    const start = Date.now();
    const snapshot = await getDocs(q);
    const results: Resource[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Resource));
    return {
      results,
      totalCount: results.length,
      searchTime: Date.now() - start
    };
  }

  subscribeToResources(
    params: ResourceSearchRequest,
    callback: (results: Resource[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    let q = query(collection(db, this.RESOURCES_COLLECTION));
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
    if (params.difficulty) {
      q = query(q, where('difficulty', '==', params.difficulty));
    }
    if (params.uploaderRole) {
      q = query(q, where('uploaderRole', '==', params.uploaderRole));
    }
    if (params.sortBy) {
      q = query(q, orderBy(params.sortBy, 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const results: Resource[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Resource));
        callback(results);
      },
      onError
    );
  }

  // --- DISCUSSION SEARCH ---
  async searchDiscussions(
    params: Partial<DiscussionSearchParams> = {}
  ): Promise<SearchResult<Discussion>> {
    let q = query(collection(db, this.DISCUSSIONS_COLLECTION));
    
    if (params.communityId) {
        q = query(q, where('communityId', '==', params.communityId));
    }
    if (params.authorId) {
        q = query(q, where('authorId', '==', params.authorId));
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
    if (params.status) {
        q = query(q, where('status', '==', params.status));
    }
    
    if (params.query) {
        const keywords = params.query.toLowerCase().split(' ').filter(k => k);
        if (keywords.length > 0) {
            q = query(q, where('keywords', 'array-contains-any', keywords));
        }
    }

    q = query(q, orderBy(params.sortBy || 'createdAt', params.sortOrder || 'desc'));

    if (params.cursor) {
      q = query(q, startAfter(params.cursor));
    }
    q = query(q, limit(params.limit || 20));

    const start = Date.now();
    const snapshot = await getDocs(q);
    const results: Discussion[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Discussion));
    
    const totalCount = results.length;

    return {
      results,
      totalCount: totalCount,
      searchTime: Date.now() - start
    };
  }

  subscribeToDiscussions(
    params: Partial<DiscussionSearchParams> = {},
    callback: (results: Discussion[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    let q = query(collection(db, this.DISCUSSIONS_COLLECTION));
    
    if (params.communityId) {
        q = query(q, where('communityId', '==', params.communityId));
    }
    if (params.authorId) {
        q = query(q, where('authorId', '==', params.authorId));
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
    if (params.status) {
        q = query(q, where('status', '==', params.status));
    }

    q = query(q, orderBy(params.sortBy || 'createdAt', params.sortOrder || 'desc'));
    q = query(q, limit(params.limit || 20));

    return onSnapshot(
      q,
      (snapshot) => {
        const results: Discussion[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Discussion));
        callback(results);
      },
      onError
    );
  }
}

export const searchService = SearchService.getInstance(); 