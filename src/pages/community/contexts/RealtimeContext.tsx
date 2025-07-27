// RealtimeContext.tsx
// Placeholder for RealtimeContext

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { UserPresence, TypingIndicator } from '../types/chat.types';
import type { RealtimeEvent, RealtimeEventType } from '../types/common.types';
import type { FirestoreError } from 'firebase/firestore';
import { RealtimeService } from '../services/realtimeService';
import { Timestamp } from 'firebase/firestore';

export interface RealtimeContextType {
  // Presence
  presences: UserPresence[];
  presenceLoading: boolean;
  presenceError: FirestoreError | null;
  setPresence: (data: {
    userId: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    currentPage?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  }) => Promise<void>;
  clearPresence: (userId: string, currentPage?: string) => Promise<void>;

  // Typing
  typingIndicators: TypingIndicator[];
  typingLoading: boolean;
  typingError: FirestoreError | null;
  setTyping: (data: TypingIndicator) => Promise<void>;
  clearTyping: (userId: string, communityId: string) => Promise<void>;

  // Custom Real-time Events
  emitEvent: <T = unknown>(event: RealtimeEvent<T>) => Promise<void>;
  subscribeToEvents: <T = unknown>(communityId: string, eventType: RealtimeEventType, callback: (events: RealtimeEvent<T>[]) => void, onError?: (error: FirestoreError) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider = ({ communityId, children }: { communityId: string; children: ReactNode }) => {
  // Presence state
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(true);
  const [presenceError, setPresenceError] = useState<FirestoreError | null>(null);
  const presenceUnsubRef = useRef<(() => void) | null>(null);

  // Typing state
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [typingLoading, setTypingLoading] = useState(true);
  const [typingError, setTypingError] = useState<FirestoreError | null>(null);
  const typingUnsubRef = useRef<(() => void) | null>(null);

  // Real-time subscription to presence
  useEffect(() => {
    setPresenceLoading(true);
    setPresenceError(null);
    if (!communityId) {
      setPresences([]);
      setPresenceLoading(false);
      return;
    }
    presenceUnsubRef.current?.();
    presenceUnsubRef.current = RealtimeService.getInstance().subscribeToPresence(
      communityId,
      (pres) => {
        setPresences(pres);
        setPresenceLoading(false);
      },
      (err) => {
        setPresenceError(err);
        setPresenceLoading(false);
      }
    );
    return () => {
      presenceUnsubRef.current?.();
    };
  }, [communityId]);

  // Real-time subscription to typing indicators
  useEffect(() => {
    setTypingLoading(true);
    setTypingError(null);
    if (!communityId) {
      setTypingIndicators([]);
      setTypingLoading(false);
      return;
    }
    typingUnsubRef.current?.();
    typingUnsubRef.current = RealtimeService.getInstance().subscribeToTypingIndicators(
      communityId,
      'general', // Default channel
      (indicators) => {
        setTypingIndicators(indicators);
        setTypingLoading(false);
      },
      (err: FirestoreError) => {
        setTypingError(err);
        setTypingLoading(false);
      }
    );
    return () => {
      typingUnsubRef.current?.();
    };
  }, [communityId]);

  // Presence actions
  const setPresence = useCallback(async (data: { userId: string; status: 'online' | 'away' | 'busy' | 'offline'; currentPage?: string; deviceType?: 'mobile' | 'desktop' | 'tablet'; }) => {
    return RealtimeService.getInstance().setPresence({
      ...data,
      lastSeen: Timestamp.now(),
    });
  }, []);
  const clearPresence = useCallback(async (userId: string, currentPage?: string) => {
    return RealtimeService.getInstance().clearPresence(userId, currentPage);
  }, []);

  // Typing actions
  const setTyping = useCallback(async (data: TypingIndicator) => {
    return RealtimeService.getInstance().setTypingIndicator(data);
  }, []);
  const clearTyping = useCallback(async (userId: string, communityId: string) => {
    return RealtimeService.getInstance().clearTypingIndicator(userId, communityId);
  }, []);

  // Custom real-time events
  const emitEvent = useCallback(async <T = unknown>(event: RealtimeEvent<T>) => {
    return RealtimeService.getInstance().emitEvent(event);
  }, []);
  const subscribeToEvents = useCallback(<T = unknown>(communityId: string, eventType: RealtimeEventType, callback: (events: RealtimeEvent<T>[]) => void, onError?: (error: FirestoreError) => void) => {
    const unsub = RealtimeService.getInstance().subscribeToEvents(communityId, eventType, callback, onError);
    return unsub;
  }, []);

  const value: RealtimeContextType = {
    presences,
    presenceLoading,
    presenceError,
    setPresence,
    clearPresence,
    typingIndicators,
    typingLoading,
    typingError,
    setTyping,
    clearTyping,
    emitEvent,
    subscribeToEvents
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtimeContext() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  return ctx;
} 