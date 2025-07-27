// NotificationContext.tsx
// Placeholder for NotificationContext

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type {
  Notification,
  NotificationPreferences,
  NotificationAnalytics,
  NotificationStatus,
  NotificationCategory,
  NotificationType
} from '../types/notification.types';
import type { FirestoreError } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: FirestoreError | null;
  preferences: NotificationPreferences | null;
  analytics: NotificationAnalytics | null;
  getPreferences: () => Promise<NotificationPreferences | null>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  getAnalytics: () => Promise<NotificationAnalytics | null>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchMoreNotifications: (filters?: { status?: NotificationStatus[]; category?: NotificationCategory[]; type?: NotificationType[]; }, sortBy?: string, sortOrder?: 'asc' | 'desc', limitCount?: number, startAfterDoc?: unknown) => Promise<Notification[]>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ userId, children }: { userId: string; children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time subscription to notifications
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = notificationService.subscribeToNotifications(
      userId,
      (notifs) => {
        setNotifications(notifs);
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
  }, [userId]);

  // Unread count
  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  // Preferences
  const getPreferences = useCallback(async () => {
    const prefs = await notificationService.getPreferences(userId);
    setPreferences(prefs);
    return prefs;
  }, [userId]);
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    await notificationService.updatePreferences(userId, updates);
    await getPreferences();
  }, [userId, getPreferences]);

  // Analytics
  const getAnalytics = useCallback(async () => {
    const analytics = await notificationService.getAnalytics(userId);
    setAnalytics(analytics);
    return analytics;
  }, [userId]);

  // Notification actions
  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  }, []);
  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead(userId);
  }, [userId]);
  const deleteNotification = useCallback(async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
  }, []);

  // Pagination support (fetch more notifications)
  const fetchMoreNotifications = useCallback(
    async (
      filters?: { status?: NotificationStatus[]; category?: NotificationCategory[]; type?: NotificationType[]; },
      sortBy?: string,
      sortOrder?: 'asc' | 'desc',
      limitCount?: number,
      startAfterDoc?: unknown
    ) => {
      return notificationService.getNotifications(userId, filters, sortBy, sortOrder, limitCount, startAfterDoc);
    },
    [userId]
  );

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    analytics,
    getPreferences,
    updatePreferences,
    getAnalytics,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchMoreNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within a NotificationProvider');
  return ctx;
} 