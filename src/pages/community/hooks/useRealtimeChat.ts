// useRealtimeChat.ts
// Placeholder for useRealtimeChat hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TypingIndicator, UserPresence } from '../types/chat.types';
import { RealtimeService } from '../services/realtimeService';
import type { FirestoreError } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * useRealtimeChat - Real-time presence and typing indicators for a community chat.
 * @param communityId - The community ID to subscribe to presence and typing.
 * @param user - The current user info (userId, displayName, photoURL, deviceType, userAgent).
 * @returns Real-time presence, typing indicators, and actions to set/clear typing and presence.
 */
export function useRealtimeChat(
  communityId: string,
  user: {
    userId: string;
    displayName: string;
    photoURL?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    userAgent?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
  }
) {
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing indicators
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId) {
      setTypingIndicators([]);
      setLoading(false);
      return;
    }
    const unsubscribe = RealtimeService.getInstance().subscribeToTypingIndicators(
      communityId,
      'general', // Default channel ID
      (indicators) => {
        setTypingIndicators(indicators);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [communityId]);

  // Subscribe to presence
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!communityId) {
      setPresences([]);
      setLoading(false);
      return;
    }
    const unsubscribe = RealtimeService.getInstance().subscribeToPresence(
      communityId,
      (pres) => {
        setPresences(pres);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [communityId]);

  // Set presence on mount, clear on unmount
  useEffect(() => {
    if (!communityId || !user.userId) return;
    RealtimeService.getInstance().setPresence({
      userId: user.userId,
      status: user.status || 'online',
      deviceType: user.deviceType,
      currentPage: 'chat',
      lastSeen: Timestamp.now(),
    });
    return () => {
      RealtimeService.getInstance().clearPresence(user.userId, communityId);
    };
  }, [communityId, user.userId, user.status, user.deviceType]);

  // Set typing indicator
  const setTyping = useCallback(() => {
    if (!communityId || !user.userId) return;
    RealtimeService.getInstance().setTypingIndicator({
      userId: user.userId,
      communityId,
      displayName: user.displayName,
      photoURL: user.photoURL || '',
      startedAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 5000)
    });
    // Auto-clear typing after 5 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      RealtimeService.getInstance().clearTypingIndicator(user.userId, communityId);
    }, 5000);
  }, [communityId, user]);

  // Clear typing indicator
  const clearTyping = useCallback(() => {
    if (!communityId || !user.userId) return;
    RealtimeService.getInstance().clearTypingIndicator(user.userId, communityId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [communityId, user.userId]);

  // Set presence (manual update)
  const setPresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!communityId || !user.userId) return;
    RealtimeService.getInstance().setPresence({
      userId: user.userId,
      status,
      deviceType: user.deviceType,
      currentPage: 'chat',
      lastSeen: Timestamp.now(),
    });
  }, [communityId, user]);

  // Clear presence (manual)
  const clearPresence = useCallback(() => {
    if (!communityId || !user.userId) return;
    RealtimeService.getInstance().clearPresence(user.userId, communityId);
  }, [communityId, user.userId]);

  return {
    typingIndicators,
    presences,
    loading,
    error,
    setTyping,
    clearTyping,
    setPresence,
    clearPresence
  };
} 