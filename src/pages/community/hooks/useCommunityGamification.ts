// useCommunityGamification.ts
// Placeholder for useCommunityGamification hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  UserPoints,
  UserBadge,
  UserStreak,
  Leaderboard,
  LeaderboardEntry,
  Challenge,
  GamificationStats
} from '../types/gamification.types';
import { gamificationService } from '../services/gamificationService';
import type { FirestoreError } from 'firebase/firestore';

function isFirestoreError(err: unknown): err is FirestoreError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string' &&
    'name' in err &&
    typeof (err as Record<string, unknown>).name === 'string'
  );
}

/**
 * useCommunityGamification - Real-time, advanced hook for user/community gamification.
 * @param userId - The user ID for gamification data.
 * @param options - Optional leaderboardId for leaderboard data.
 * @returns Gamification state, real-time data, and gamification actions.
 */
export function useCommunityGamification(
  userId: string,
  options?: {
    leaderboardId?: string;
  }
) {
  // User Points
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState<FirestoreError | null>(null);
  const pointsUnsubRef = useRef<(() => void) | null>(null);

  // User Badges
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesError, setBadgesError] = useState<FirestoreError | null>(null);
  const badgesUnsubRef = useRef<(() => void) | null>(null);

  // User Streak
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState<FirestoreError | null>(null);
  const streakUnsubRef = useRef<(() => void) | null>(null);

  // Leaderboard Entries
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<FirestoreError | null>(null);
  const leaderboardUnsubRef = useRef<(() => void) | null>(null);

  // Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState<FirestoreError | null>(null);

  // Gamification Stats
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<FirestoreError | null>(null);

  // Real-time subscription to user points
  useEffect(() => {
    setPointsLoading(true);
    setPointsError(null);
    pointsUnsubRef.current?.();
    pointsUnsubRef.current = gamificationService.subscribeToUserPoints(
      userId,
      (pts) => {
        setPoints(pts);
        setPointsLoading(false);
      },
      (err) => {
        setPointsError(err);
        setPointsLoading(false);
      }
    );
    return () => {
      pointsUnsubRef.current?.();
    };
  }, [userId]);

  // Real-time subscription to user badges
  useEffect(() => {
    setBadgesLoading(true);
    setBadgesError(null);
    badgesUnsubRef.current?.();
    badgesUnsubRef.current = gamificationService.subscribeToUserBadges(
      userId,
      (bgs) => {
        setBadges(bgs);
        setBadgesLoading(false);
      },
      (err) => {
        setBadgesError(err);
        setBadgesLoading(false);
      }
    );
    return () => {
      badgesUnsubRef.current?.();
    };
  }, [userId]);

  // Real-time subscription to user streak
  useEffect(() => {
    setStreakLoading(true);
    setStreakError(null);
    streakUnsubRef.current?.();
    streakUnsubRef.current = gamificationService.subscribeToUserStreak(
      userId,
      (strk) => {
        setStreak(strk);
        setStreakLoading(false);
      },
      (err) => {
        setStreakError(err);
        setStreakLoading(false);
      }
    );
    return () => {
      streakUnsubRef.current?.();
    };
  }, [userId]);

  // Real-time subscription to leaderboard entries
  useEffect(() => {
    if (!options?.leaderboardId) return;
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    leaderboardUnsubRef.current?.();
    leaderboardUnsubRef.current = gamificationService.subscribeToLeaderboard(
      options.leaderboardId,
      (entries) => {
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
      },
      (err) => {
        setLeaderboardError(err);
        setLeaderboardLoading(false);
      }
    );
    return () => {
      leaderboardUnsubRef.current?.();
    };
  }, [options?.leaderboardId]);

  // Fetch challenges (not real-time)
  const fetchChallenges = useCallback(async () => {
    setChallengesLoading(true);
    setChallengesError(null);
    try {
      const chals = await gamificationService.getChallenges();
      setChallenges(chals);
    } catch (err: unknown) {
      if (isFirestoreError(err)) {
        setChallengesError(err);
      } else {
        setChallengesError({ code: 'unknown', message: 'Unknown error', name: 'Error' });
      }
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  // Fetch gamification stats (not real-time)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const s = await gamificationService.getUserGamificationStats(userId);
      setStats(s);
    } catch (err: unknown) {
      if (isFirestoreError(err)) {
        setStatsError(err);
      } else {
        setStatsError({ code: 'unknown', message: 'Unknown error', name: 'Error' });
      }
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  // Add points
  const addPoints = useCallback(async (userId: string, points: number, reason: string) => {
    return gamificationService.addPoints(userId, points, reason);
  }, []);

  // Earn badge
  const earnBadge = useCallback(async (userId: string, badgeId: string) => {
    return gamificationService.earnBadge(userId, badgeId);
  }, []);

  return {
    points, pointsLoading, pointsError,
    badges, badgesLoading, badgesError,
    streak, streakLoading, streakError,
    leaderboardEntries, leaderboardLoading, leaderboardError,
    challenges, challengesLoading, challengesError, fetchChallenges,
    stats, statsLoading, statsError, fetchStats,
    addPoints, earnBadge
  };
} 