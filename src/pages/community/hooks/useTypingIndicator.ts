// useTypingIndicator.ts
// Placeholder for useTypingIndicator hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TypingIndicator } from '../types/chat.types';
import { RealtimeService } from '../services/realtimeService';
import type { FirestoreError } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * useTypingIndicator - Real-time typing indicator hook for a community chat.
 * @param communityId - The community ID to subscribe to typing indicators.
 * @param user - The current user info (userId, displayName, photoURL).
 * @param channelId - The chat channel ID (default: 'general').
 * @returns Real-time typing indicators and actions to set/clear typing.
 */
export function useTypingIndicator(
  communityId: string,
  user: {
    userId: string;
    displayName: string;
    photoURL?: string;
  },
  channelId: string = 'general'
) {
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
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
      channelId,
      (indicators) => {
        setTypingIndicators(indicators);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [communityId, channelId]);

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

  return {
    typingIndicators,
    loading,
    error,
    setTyping,
    clearTyping
  };
} 