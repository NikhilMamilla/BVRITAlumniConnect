import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/AuthContext';
import { notificationService } from '../services/notificationService';
import { Notification, NotificationStatus } from '../types/notification.types';
import { FirestoreError } from 'firebase/firestore';

export const useNotifications = (limit: number = 20) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    unsubscribeRef.current?.(); // Unsubscribe from previous user

    unsubscribeRef.current = notificationService.subscribeToNotifications(
      currentUser.uid,
      (fetchedNotifications) => {
        const newUnreadCount = fetchedNotifications.filter(
          (n) => n.status !== NotificationStatus.READ && n.status !== NotificationStatus.CLICKED
        ).length;
        setNotifications(fetchedNotifications);
        setUnreadCount(newUnreadCount);
        setLoading(false);
      },
      (err) => {
        setError(err as FirestoreError);
        setLoading(false);
      },
      {}, // No filters for the bell icon
      'createdAt',
      'desc'
    );

    return () => unsubscribeRef.current?.();
  }, [currentUser, limit]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser || unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead(currentUser.uid);
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
      // Optionally set an error state to show in the UI
    }
  }, [currentUser, unreadCount]);

  return { notifications, unreadCount, markAllAsRead, loading, error };
}; 