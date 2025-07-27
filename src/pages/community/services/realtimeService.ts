// realtimeService.ts
// Placeholder for realtimeService

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  FirestoreError,
  Unsubscribe,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  UserPresence,
  TypingIndicator
} from '../types/chat.types';
import type {
  RealtimeEvent,
  RealtimeEventType,
  PresenceData
} from '../types/common.types';

export class RealtimeService {
  private static instance: RealtimeService;
  private readonly TYPING_COLLECTION = 'typingIndicators';
  private readonly PRESENCE_COLLECTION = 'onlinePresence';
  // Optionally, a collection for custom real-time events
  private readonly EVENTS_COLLECTION = 'realtimeEvents';

  private constructor() {}
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // =========================
  // Presence
  // =========================

  async setPresence(data: PresenceData): Promise<void> {
    const presenceId = `${data.userId}_${data.currentPage || 'global'}`;
    const ref = doc(db, this.PRESENCE_COLLECTION, presenceId);
    await setDoc(ref, {
      ...data,
      lastSeen: new Date(),
      status: data.status,
      updatedAt: serverTimestamp()
    });
  }

  async clearPresence(userId: string, currentPage: string = 'global'): Promise<void> {
    const presenceId = `${userId}_${currentPage}`;
    const ref = doc(db, this.PRESENCE_COLLECTION, presenceId);
    await deleteDoc(ref);
  }

  subscribeToPresence(
    communityId: string,
    callback: (presences: UserPresence[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.PRESENCE_COLLECTION), where('communityId', '==', communityId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const presences = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserPresence));
      callback(presences);
    }, onError);
    return unsubscribe;
  }

  // =========================
  // Typing Indicators
  // =========================

  async setTypingIndicator(data: TypingIndicator): Promise<void> {
    const indicatorId = `${data.userId}_${data.communityId}`;
    const ref = doc(db, this.TYPING_COLLECTION, indicatorId);
    await setDoc(ref, {
      ...data,
      startedAt: new Date(),
      isTyping: true,
      updatedAt: serverTimestamp()
    });
  }

  async clearTypingIndicator(userId: string, communityId: string): Promise<void> {
    const indicatorId = `${userId}_${communityId}`;
    const ref = doc(db, this.TYPING_COLLECTION, indicatorId);
    await deleteDoc(ref);
  }

  subscribeToTypingIndicators(
    communityId: string,
    channelId: string,
    callback: (indicators: TypingIndicator[]) => void,
    onError: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.TYPING_COLLECTION), where('communityId', '==', communityId), where('channelId', '==', channelId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as TypingIndicator));
      callback(typing);
    }, onError);
    return unsubscribe;
  }

  // =========================
  // Real-time Events (optional, for custom events)
  // =========================

  async emitEvent<T = unknown>(event: RealtimeEvent<T>): Promise<void> {
    await addDoc(collection(db, this.EVENTS_COLLECTION), {
      ...event,
      timestamp: serverTimestamp()
    });
  }

  subscribeToEvents<T = unknown>(
    communityId: string,
    eventType: RealtimeEventType,
    callback: (events: RealtimeEvent<T>[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.EVENTS_COLLECTION), where('data.communityId', '==', communityId), where('type', '==', eventType), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as RealtimeEvent<T>));
      callback(events);
    }, onError);
    return unsubscribe;
  }
}

export const realtimeService = RealtimeService.getInstance(); 