// useCommunityChat.ts
// Placeholder for useCommunityChat hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  ChatMessage,
  ChatMessageCreate,
  ChatMessageUpdate,
  MessageReactionCreate,
  TypingIndicator,
  UserPresence,
  ChatSearchParams,
  ChatMessagePage
} from '../types/chat.types';
import { ChatService } from '../services/chatService';
import type { FirestoreError } from 'firebase/firestore';

/**
 * useCommunityChat - Advanced, real-time chat hook for a community.
 * @param communityId - The community ID to subscribe to chat messages.
 * @param options - Optional filters, pagination, and sort options.
 * @returns Chat state, real-time messages, and chat actions.
 */
export function useCommunityChat(
  communityId: string,
  options?: {
    filters?: Partial<ChatSearchParams>;
    pagination?: { limit: number; startAfter?: unknown };
    sortOptions?: { field: string; direction: 'asc' | 'desc' };
  }
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time subscription to messages
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = ChatService.getInstance().subscribeToMessages(
      communityId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      options?.filters,
      options?.sortOptions
    );
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, JSON.stringify(options?.filters), JSON.stringify(options?.sortOptions)]);

  // Send a new message
  const sendMessage = useCallback(
    async (message: ChatMessageCreate, authorId: string) => {
      return ChatService.getInstance().sendMessage(communityId, message, authorId);
    },
    [communityId]
  );

  // Edit a message
  const editMessage = useCallback(
    async (messageId: string, updates: ChatMessageUpdate, editorId: string) => {
      return ChatService.getInstance().editMessage(messageId, updates, editorId);
    },
    []
  );

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string, deleterId: string) => {
      return ChatService.getInstance().deleteMessage(messageId, deleterId);
    },
    []
  );

  // Pin/unpin a message
  const pinMessage = useCallback(
    async (messageId: string, userId: string) => {
      return ChatService.getInstance().pinMessage(messageId, userId);
    },
    []
  );
  const unpinMessage = useCallback(
    async (messageId: string, userId: string) => {
      return ChatService.getInstance().unpinMessage(messageId, userId);
    },
    []
  );

  // Bookmark/unbookmark a message
  const bookmarkMessage = useCallback(
    async (messageId: string, userId: string) => {
      return ChatService.getInstance().bookmarkMessage(messageId, userId);
    },
    []
  );
  const unbookmarkMessage = useCallback(
    async (messageId: string, userId: string) => {
      return ChatService.getInstance().unbookmarkMessage(messageId, userId);
    },
    []
  );

  // Add/remove reaction
  const addReaction = useCallback(
    async (messageId: string, reaction: MessageReactionCreate) => {
      return ChatService.getInstance().addReaction(messageId, reaction);
    },
    []
  );
  const removeReaction = useCallback(
    async (messageId: string, reactionId: string) => {
      return ChatService.getInstance().removeReaction(messageId, reactionId);
    },
    []
  );

  // Report a message
  const reportMessage = useCallback(
    async (messageId: string, userId: string, reason: string) => {
      return ChatService.getInstance().reportMessage(messageId, userId, reason);
    },
    []
  );

  // Hide a message (moderator)
  const hideMessage = useCallback(
    async (messageId: string, moderatorId: string, reason: string) => {
      return ChatService.getInstance().hideMessage(messageId, moderatorId, reason);
    },
    []
  );

  // Infinite scroll/pagination support (fetch more messages)
  const fetchMoreMessages = useCallback(
    async (pagination: { limit: number; startAfter?: unknown }, filters?: Partial<ChatSearchParams>, sortOptions?: { field: string; direction: 'asc' | 'desc' }) => {
      return ChatService.getInstance().listMessages(communityId, filters, pagination, sortOptions);
    },
    [communityId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    bookmarkMessage,
    unbookmarkMessage,
    addReaction,
    removeReaction,
    reportMessage,
    hideMessage,
    fetchMoreMessages
  };
} 