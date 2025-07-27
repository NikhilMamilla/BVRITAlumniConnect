// ChatContext.tsx
// Placeholder for ChatContext

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
import type { FirestoreError } from 'firebase/firestore';
import { ChatService } from '../services/chatService';

export interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: FirestoreError | null;
  sendMessage: (message: ChatMessageCreate, authorId: string) => Promise<string>;
  editMessage: (messageId: string, updates: ChatMessageUpdate, editorId: string) => Promise<void>;
  deleteMessage: (messageId: string, deleterId: string) => Promise<void>;
  pinMessage: (messageId: string, userId: string) => Promise<void>;
  unpinMessage: (messageId: string, userId: string) => Promise<void>;
  bookmarkMessage: (messageId: string, userId: string) => Promise<void>;
  unbookmarkMessage: (messageId: string, userId: string) => Promise<void>;
  addReaction: (messageId: string, reaction: MessageReactionCreate) => Promise<void>;
  removeReaction: (messageId: string, reactionId: string) => Promise<void>;
  reportMessage: (messageId: string, userId: string, reason: string) => Promise<void>;
  hideMessage: (messageId: string, moderatorId: string, reason: string) => Promise<void>;
  fetchMoreMessages: (pagination: { limit: number; startAfter?: unknown }, filters?: Partial<ChatSearchParams>, sortOptions?: { field: string; direction: 'asc' | 'desc' }) => Promise<ChatMessagePage>;
  // Typing and presence
  typingIndicators: TypingIndicator[];
  presences: UserPresence[];
  setTyping: (userId: string, communityId: string, displayName: string, photoURL?: string) => Promise<void>;
  clearTyping: (userId: string, communityId: string) => Promise<void>;
  setPresence: (userId: string, communityId: string, status: 'online' | 'away' | 'busy' | 'offline', deviceType: 'desktop' | 'mobile' | 'tablet', userAgent?: string) => Promise<void>;
  clearPresence: (userId: string, communityId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ communityId, children }: { communityId: string; children: ReactNode }) => {
  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Typing and presence state
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const typingUnsubRef = useRef<(() => void) | null>(null);
  const presenceUnsubRef = useRef<(() => void) | null>(null);

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
      }
    );
    return () => {
      unsubscribeRef.current?.();
    };
  }, [communityId]);

  // Real-time subscription to typing indicators
  useEffect(() => {
    if (!communityId) {
      setTypingIndicators([]);
      return;
    }
    typingUnsubRef.current?.();
    typingUnsubRef.current = ChatService.getInstance().subscribeToTypingIndicators(
      communityId,
      (indicators) => setTypingIndicators(indicators),
      (err) => setTypingIndicators([])
    );
    return () => {
      typingUnsubRef.current?.();
    };
  }, [communityId]);

  // Real-time subscription to presence
  useEffect(() => {
    if (!communityId) {
      setPresences([]);
      return;
    }
    presenceUnsubRef.current?.();
    presenceUnsubRef.current = ChatService.getInstance().subscribeToPresence(
      communityId,
      (pres) => setPresences(pres),
      (err) => setPresences([])
    );
    return () => {
      presenceUnsubRef.current?.();
    };
  }, [communityId]);

  // Chat actions
  const sendMessage = useCallback(async (message: ChatMessageCreate, authorId: string) => {
    return ChatService.getInstance().sendMessage(communityId, message, authorId);
  }, [communityId]);
  const editMessage = useCallback(async (messageId: string, updates: ChatMessageUpdate, editorId: string) => {
    return ChatService.getInstance().editMessage(messageId, updates, editorId);
  }, []);
  const deleteMessage = useCallback(async (messageId: string, deleterId: string) => {
    return ChatService.getInstance().deleteMessage(messageId, deleterId);
  }, []);
  const pinMessage = useCallback(async (messageId: string, userId: string) => {
    return ChatService.getInstance().pinMessage(messageId, userId);
  }, []);
  const unpinMessage = useCallback(async (messageId: string, userId: string) => {
    return ChatService.getInstance().unpinMessage(messageId, userId);
  }, []);
  const bookmarkMessage = useCallback(async (messageId: string, userId: string) => {
    return ChatService.getInstance().bookmarkMessage(messageId, userId);
  }, []);
  const unbookmarkMessage = useCallback(async (messageId: string, userId: string) => {
    return ChatService.getInstance().unbookmarkMessage(messageId, userId);
  }, []);
  const addReaction = useCallback(async (messageId: string, reaction: MessageReactionCreate) => {
    return ChatService.getInstance().addReaction(messageId, reaction);
  }, []);
  const removeReaction = useCallback(async (messageId: string, reactionId: string) => {
    return ChatService.getInstance().removeReaction(messageId, reactionId);
  }, []);
  const reportMessage = useCallback(async (messageId: string, userId: string, reason: string) => {
    return ChatService.getInstance().reportMessage(messageId, userId, reason);
  }, []);
  const hideMessage = useCallback(async (messageId: string, moderatorId: string, reason: string) => {
    return ChatService.getInstance().hideMessage(messageId, moderatorId, reason);
  }, []);
  const fetchMoreMessages = useCallback(async (pagination: { limit: number; startAfter?: unknown }, filters?: Partial<ChatSearchParams>, sortOptions?: { field: string; direction: 'asc' | 'desc' }) => {
    return ChatService.getInstance().listMessages(communityId, filters, pagination, sortOptions);
  }, [communityId]);

  // Typing and presence actions
  const setTyping = useCallback(async (userId: string, communityId: string, displayName: string, photoURL?: string) => {
    return ChatService.getInstance().setTypingIndicator(communityId, userId, displayName, photoURL);
  }, []);
  const clearTyping = useCallback(async (userId: string, communityId: string) => {
    return ChatService.getInstance().clearTypingIndicator(communityId, userId);
  }, []);
  const setPresence = useCallback(async (userId: string, communityId: string, status: 'online' | 'away' | 'busy' | 'offline', deviceType: 'desktop' | 'mobile' | 'tablet', userAgent?: string) => {
    return ChatService.getInstance().setUserPresence(communityId, userId, status, deviceType, userAgent);
  }, []);
  const clearPresence = useCallback(async (userId: string, communityId: string) => {
    return ChatService.getInstance().clearUserPresence(communityId, userId);
  }, []);

  const value: ChatContextType = {
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
    fetchMoreMessages,
    typingIndicators,
    presences,
    setTyping,
    clearTyping,
    setPresence,
    clearPresence
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within a ChatProvider');
  return ctx;
} 