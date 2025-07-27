// gamificationService.ts
// Placeholder for gamificationService

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  FirestoreError,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  UserPoints,
  PointTransaction,
  Badge,
  UserBadge,
  UserStreak,
  Leaderboard,
  LeaderboardEntry,
  Challenge,
  UserGamificationPreferences,
  GamificationStats
} from '../types/gamification.types';

export class GamificationService {
  private static instance: GamificationService;
  private readonly POINTS_COLLECTION = 'userPoints';
  private readonly TRANSACTIONS_COLLECTION = 'pointTransactions';
  private readonly BADGES_COLLECTION = 'badges';
  private readonly USER_BADGES_COLLECTION = 'userBadges';
  private readonly STREAKS_COLLECTION = 'userStreaks';
  private readonly LEADERBOARDS_COLLECTION = 'leaderboards';
  private readonly ENTRIES_COLLECTION = 'leaderboardEntries';
  private readonly CHALLENGES_COLLECTION = 'challenges';
  private readonly PREFERENCES_COLLECTION = 'userGamificationPreferences';

  private constructor() {}
  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // =========================
  // Points
  // =========================

  async getUserPoints(userId: string): Promise<UserPoints | null> {
    const ref = doc(db, this.POINTS_COLLECTION, userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as unknown as UserPoints;
  }

  async addPoints(userId: string, points: number, reason: string): Promise<void> {
    const ref = doc(db, this.POINTS_COLLECTION, userId);
    await updateDoc(ref, {
      totalPoints: points,
      lastPointsEarned: points,
      lastPointsDate: new Date(),
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, this.TRANSACTIONS_COLLECTION), {
      userId,
      points,
      reason,
      transactionType: 'earned',
      status: 'completed',
      processedAt: serverTimestamp()
    });
  }

  subscribeToUserPoints(
    userId: string,
    callback: (points: UserPoints | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const ref = doc(db, this.POINTS_COLLECTION, userId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback({ id: snapshot.id, ...snapshot.data() } as unknown as UserPoints);
    }, onError);
    return unsubscribe;
  }

  // =========================
  // Badges
  // =========================

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const q = query(collection(db, this.USER_BADGES_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserBadge));
  }

  async earnBadge(userId: string, badgeId: string): Promise<void> {
    await addDoc(collection(db, this.USER_BADGES_COLLECTION), {
      userId,
      badgeId,
      earnedAt: new Date(),
      isCompleted: true,
      completionPercentage: 100,
      isDisplayed: true,
      displayOrder: 0,
      celebrationShown: false,
      sharedWithCommunity: false,
      congratulationsReceived: 0
    });
  }

  subscribeToUserBadges(
    userId: string,
    callback: (badges: UserBadge[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.USER_BADGES_COLLECTION), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserBadge));
      callback(badges);
    }, onError);
    return unsubscribe;
  }

  async getAllBadgesFromCollection(): Promise<Badge[]> {
    const q = query(collection(db, this.BADGES_COLLECTION), where('isGlobal', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Badge));
  }

  // =========================
  // Streaks
  // =========================

  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const ref = doc(db, this.STREAKS_COLLECTION, userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as unknown as UserStreak;
  }

  subscribeToUserStreak(
    userId: string,
    callback: (streak: UserStreak | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const ref = doc(db, this.STREAKS_COLLECTION, userId);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback({ id: snapshot.id, ...snapshot.data() } as unknown as UserStreak);
    }, onError);
    return unsubscribe;
  }

  // =========================
  // Leaderboards
  // =========================

  async getLeaderboard(leaderboardId: string): Promise<Leaderboard | null> {
    const ref = doc(db, this.LEADERBOARDS_COLLECTION, leaderboardId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as unknown as Leaderboard;
  }

  async getLeaderboardEntries(leaderboardId: string, limitCount = 20): Promise<LeaderboardEntry[]> {
    const q = query(collection(db, this.LEADERBOARDS_COLLECTION, leaderboardId, 'entries'), orderBy('score', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LeaderboardEntry));
  }

  subscribeToLeaderboard(leaderboardId: string, callback: (entries: LeaderboardEntry[]) => void, onError: (error: FirestoreError) => void, limitCount = 20): Unsubscribe {
    const q = query(collection(db, this.LEADERBOARDS_COLLECTION, leaderboardId, 'entries'), orderBy('score', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LeaderboardEntry));
      callback(entries);
    }, onError);
    return unsubscribe;
  }

  // =========================
  // Challenges
  // =========================

  async getChallenges(): Promise<Challenge[]> {
    const q = query(collection(db, this.CHALLENGES_COLLECTION), where('status', 'in', ['active', 'upcoming']), orderBy('startDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Challenge));
  }

  async getUserGamificationStats(userId: string): Promise<GamificationStats | null> {
    const ref = doc(db, 'userGamificationStats', userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as unknown as GamificationStats;
  }
}

export const gamificationService = GamificationService.getInstance(); 