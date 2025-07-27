// useCommunitySearch.ts
// Placeholder for useCommunitySearch hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Community, CommunityFilter } from '../types/community.types';
import type { ChatMessage, ChatSearchParams } from '../types/chat.types';
import { SearchService } from '../services/searchService';
import type { FirestoreError } from 'firebase/firestore';

const searchService = SearchService.getInstance();

/**
 * useCommunitySearch - Real-time, advanced hook for searching communities, members, chat messages, and resources.
 * @returns Search state, real-time results, and search actions.
 */
export function useCommunitySearch() {
  // Communities
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitiesError, setCommunitiesError] = useState<FirestoreError | null>(null);
  const communitiesUnsubRef = useRef<(() => void) | null>(null);

  // Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
  const [chatMessagesError, setChatMessagesError] = useState<FirestoreError | null>(null);
  const chatMessagesUnsubRef = useRef<(() => void) | null>(null);

  // Search communities
  const searchCommunities = useCallback((searchQuery: string, filter: CommunityFilter = {}) => {
    setCommunitiesLoading(true);
    communitiesUnsubRef.current?.(); // Unsubscribe from previous search
    communitiesUnsubRef.current = searchService.subscribeToCommunities(
      filter,
      searchQuery,
      (results) => {
        setCommunities(results);
        setCommunitiesLoading(false);
      },
      (error) => {
        setCommunitiesError(error);
        setCommunitiesLoading(false);
      }
    );
  }, []);

  // Search chat messages
  const searchChatMessages = useCallback(async (params: ChatSearchParams, pagination?: { limit: number; startAfter?: any }) => {
    setChatMessagesLoading(true);
    try {
      const result = await searchService.searchChatMessages(params, pagination);
      setChatMessages(result.results);
      setChatMessagesError(null);
      return result;
    } catch (error) {
      const firestoreError = error as FirestoreError;
      setChatMessagesError(firestoreError);
      throw error;
    } finally {
      setChatMessagesLoading(false);
    }
  }, []);

  // Subscribe to chat messages
  const subscribeToChatMessages = useCallback((
    params: ChatSearchParams,
    callback: (results: ChatMessage[]) => void,
    onError?: (error: FirestoreError) => void
  ) => {
    chatMessagesUnsubRef.current?.(); // Unsubscribe from previous subscription
    chatMessagesUnsubRef.current = searchService.subscribeToChatMessages(
      params,
      callback,
      onError
    );
    return chatMessagesUnsubRef.current;
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      communitiesUnsubRef.current?.();
      chatMessagesUnsubRef.current?.();
    };
  }, []);

  return {
    // Communities
    communities,
    communitiesLoading,
    communitiesError,
    searchCommunities,
    // Chat Messages
    chatMessages,
    chatMessagesLoading,
    chatMessagesError,
    searchChatMessages,
    subscribeToChatMessages,
    // Placeholder for other search types
    members: [],
    membersLoading: false,
    membersError: null,
    searchMembers: () => {},
  };
}