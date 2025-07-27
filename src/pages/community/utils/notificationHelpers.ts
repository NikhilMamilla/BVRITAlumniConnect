// notificationHelpers.ts
// Advanced, Firestore-compliant notification helpers for the community platform

import type {
  Notification,
  NotificationPreferences,
  NotificationStatus,
  NotificationChannel,
  NotificationCategory,
  NotificationType,
  NotificationAction,
  NotificationAnalytics,
  LiveNotification
} from '../types/notification.types';
import { DEFAULTS } from './constants';
import { Timestamp } from 'firebase/firestore';

// Format a notification for display/logs
export function formatNotification(notification: Notification): string {
  return `${notification.title}: ${notification.message}`;
}

// Status checks
export function isRead(notification: Notification): boolean {
  return notification.status === 'read';
}
export function isPending(notification: Notification): boolean {
  return notification.status === 'pending';
}
export function isFailed(notification: Notification): boolean {
  return notification.status === 'failed';
}
export function isDismissed(notification: Notification): boolean {
  return notification.status === 'dismissed';
}
export function isExpired(notification: Notification): boolean {
  return notification.status === 'expired';
}

// Channel/category/type/preference checks
export function isChannelEnabled(preferences: NotificationPreferences, channel: NotificationChannel): boolean {
  return preferences.channels[channel] === true;
}
export function isCategoryEnabled(preferences: NotificationPreferences, category: NotificationCategory): boolean {
  return preferences.categories[category]?.enabled === true;
}
export function isTypeEnabled(preferences: NotificationPreferences, type: NotificationType): boolean {
  return preferences.typePreferences[type]?.enabled !== false;
}
export function shouldNotify(
  preferences: NotificationPreferences,
  type: NotificationType,
  category: NotificationCategory,
  channel: NotificationChannel
): boolean {
  return (
    preferences.enabled &&
    isChannelEnabled(preferences, channel) &&
    isCategoryEnabled(preferences, category) &&
    isTypeEnabled(preferences, type)
  );
}

// Action helpers
export function getPrimaryAction(notification: Notification): NotificationAction | undefined {
  return notification.actions?.find(a => a.style === 'primary');
}
export function getActionById(notification: Notification, actionId: string): NotificationAction | undefined {
  return notification.actions?.find(a => a.id === actionId);
}

// Analytics helpers
export function getNotificationAnalyticsSummary(analytics: NotificationAnalytics) {
  return {
    totalSent: analytics.totalSent,
    totalDelivered: analytics.totalDelivered,
    totalRead: analytics.totalRead,
    totalClicked: analytics.totalClicked,
    deliveryRate: analytics.deliveryRate,
    readRate: analytics.readRate,
    clickRate: analytics.clickRate,
  };
}

// Grouping/batching helpers
export function isGrouped(notification: Notification): boolean {
  return !!notification.groupId;
}
export function getGroupId(notification: Notification): string | undefined {
  return notification.groupId;
}

// Utility: Generate Firestore payload for a new notification
export function generateNotificationPayload(
  data: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>
): Omit<Notification, 'id'> {
  return {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    impressions: 0,
    clicks: 0,
  };
}

// Utility: Convert a Notification to a LiveNotification (for in-app toasts, etc.)
export function toLiveNotification(notification: Notification): LiveNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt,
    relatedId: notification.relatedId,
    relatedType: notification.relatedType,
    duration: 7, // seconds, default for toast
    persistent: false,
    position: 'top-right',
    actions: notification.actions,
    variant: 'info',
    icon: notification.senderAvatar || DEFAULTS.NOTIFICATION_ICON,
  };
} 