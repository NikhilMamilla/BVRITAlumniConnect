// notificationService.ts
// Placeholder for notificationService

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  Notification,
  NotificationPreferences,
  NotificationStatus,
  NotificationCategory,
  NotificationType,
  NotificationAnalytics
} from '../types/notification.types';

export class NotificationService {
  private static instance: NotificationService;
  private readonly NOTIFICATIONS_COLLECTION = 'notifications';
  private readonly PREFERENCES_COLLECTION = 'notificationPreferences';
  private readonly ANALYTICS_COLLECTION = 'notificationAnalytics';

  private constructor() {}
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get notifications for a user (with filters, sorting, pagination)
   */
  async getNotifications(
    userId: string,
    filters: {
      status?: NotificationStatus[];
      category?: NotificationCategory[];
      type?: NotificationType[];
    } = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    limitCount: number = 20,
    startAfterDoc?: unknown
  ): Promise<Notification[]> {
    let q = query(collection(db, this.NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    q = query(q, orderBy(sortBy, sortOrder), limit(limitCount));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  }

  /**
   * Real-time subscribe to notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    onError?: (error: FirestoreError) => void,
    filters: {
      status?: NotificationStatus[];
      category?: NotificationCategory[];
      type?: NotificationType[];
    } = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Unsubscribe {
    let q = query(collection(db, this.NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }
    if (filters.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    q = query(q, orderBy(sortBy, sortOrder));
    return onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
      },
      onError
    );
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      status: 'read',
      readAt: serverTimestamp()
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(collection(db, this.NOTIFICATIONS_COLLECTION), where('userId', '==', userId), where('status', '!=', 'read'));
    const snapshot = await getDocs(q);
    const batch = (await import('firebase/firestore')).writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { status: 'read', readAt: serverTimestamp() });
    });
    await batch.commit();
  }

  /**
   * Dismiss/delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const prefRef = doc(db, this.PREFERENCES_COLLECTION, userId);
    const snapshot = await getDoc(prefRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), userId } as NotificationPreferences;
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<void> {
    const prefRef = doc(db, this.PREFERENCES_COLLECTION, userId);
    await updateDoc(prefRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get notification analytics (read-only)
   */
  async getAnalytics(userId: string): Promise<NotificationAnalytics | null> {
    const analyticsRef = doc(db, this.ANALYTICS_COLLECTION, userId);
    const snapshot = await getDoc(analyticsRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), userId } as NotificationAnalytics;
  }
}

export const notificationService = NotificationService.getInstance(); 