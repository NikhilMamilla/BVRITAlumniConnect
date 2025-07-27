// src/pages/community/types/notification.types.ts

import { Timestamp } from 'firebase/firestore';

// ===============================
// CORE NOTIFICATION TYPES
// ===============================

export interface Notification {
  id: string;
  userId: string; // Recipient user ID
  
  // Content
  type: NotificationType;
  title: string;
  message: string;
  shortMessage?: string; // For mobile/brief displays
  
  // Metadata
  category: NotificationCategory;
  priority: NotificationPriority;
  
  // Related Data
  relatedId?: string; // ID of related entity (community, event, message, etc.)
  relatedType?: NotificationRelatedType;
  relatedData?: NotificationRelatedData;
  
  // Sender Info
  senderId?: string; // Who triggered this notification
  senderName?: string;
  senderAvatar?: string;
  senderRole?: 'student' | 'alumni';
  
  // Actions
  actionUrl?: string; // Deep link to relevant page
  actionText?: string; // "View Community", "Join Event", etc.
  actions?: NotificationAction[]; // Multiple action buttons
  
  // Status & Tracking
  status: NotificationStatus;
  readAt?: Timestamp;
  clickedAt?: Timestamp;
  dismissedAt?: Timestamp;
  
  // Delivery
  channels: NotificationChannel[];
  deliveryStatus: DeliveryStatus;
  sentVia: NotificationChannel[];
  failedChannels: NotificationChannel[];
  
  // Scheduling
  scheduledFor?: Timestamp; // For delayed notifications
  expiresAt?: Timestamp;
  
  // Grouping
  groupId?: string; // For batched notifications
  batchSize?: number;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Analytics
  impressions: number;
  clicks: number;
}

// ===============================
// NOTIFICATION ENUMS
// ===============================

export enum NotificationType {
  // Community Related
  COMMUNITY_INVITE = 'community_invite',
  COMMUNITY_JOIN_REQUEST = 'community_join_request',
  COMMUNITY_JOIN_APPROVED = 'community_join_approved',
  COMMUNITY_JOIN_REJECTED = 'community_join_rejected',
  COMMUNITY_NEW_MEMBER = 'community_new_member',
  COMMUNITY_ROLE_CHANGED = 'community_role_changed',
  COMMUNITY_ANNOUNCEMENT = 'community_announcement',
  COMMUNITY_UPDATED = 'community_updated',
  
  // Chat & Messages
  CHAT_MESSAGE = 'chat_message',
  CHAT_MENTION = 'chat_mention',
  CHAT_REPLY = 'chat_reply',
  CHAT_REACTION = 'chat_reaction',
  DIRECT_MESSAGE = 'direct_message',
  
  // Discussions
  DISCUSSION_NEW_POST = 'discussion_new_post',
  DISCUSSION_REPLY = 'discussion_reply',
  DISCUSSION_MENTION = 'discussion_mention',
  DISCUSSION_UPVOTE = 'discussion_upvote',
  DISCUSSION_SOLVED = 'discussion_solved',
  DISCUSSION_PINNED = 'discussion_pinned',
  
  // Events
  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_REMINDER = 'event_reminder',
  EVENT_STARTING = 'event_starting',
  EVENT_INVITE = 'event_invite',
  EVENT_RSVP_APPROVED = 'event_rsvp_approved',
  EVENT_RSVP_REJECTED = 'event_rsvp_rejected',
  
  // Resources
  RESOURCE_SHARED = 'resource_shared',
  RESOURCE_APPROVED = 'resource_approved',
  RESOURCE_REJECTED = 'resource_rejected',
  RESOURCE_DOWNLOADED = 'resource_downloaded',
  
  // Gamification
  ACHIEVEMENT_EARNED = 'achievement_earned',
  BADGE_AWARDED = 'badge_awarded',
  LEVEL_UP = 'level_up',
  POINTS_EARNED = 'points_earned',
  LEADERBOARD_POSITION = 'leaderboard_position',
  
  // Moderation
  CONTENT_REPORTED = 'content_reported',
  CONTENT_REMOVED = 'content_removed',
  USER_WARNED = 'user_warned',
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
  
  // System
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  ACCOUNT_SECURITY = 'account_security',
  FEATURE_UPDATE = 'feature_update',
  
  // Mentorship
  MENTORSHIP_REQUEST = 'mentorship_request',
  MENTORSHIP_ACCEPTED = 'mentorship_accepted',
  MENTORSHIP_DECLINED = 'mentorship_declined',
  SESSION_SCHEDULED = 'session_scheduled',
  SESSION_REMINDER = 'session_reminder'
}

export enum NotificationCategory {
  SOCIAL = 'social',
  COMMUNITY = 'community',
  EVENTS = 'events',
  LEARNING = 'learning',
  ACHIEVEMENTS = 'achievements',
  MODERATION = 'moderation',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  CLICKED = 'clicked',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  BROWSER = 'browser'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  PARTIAL = 'partial', // Some channels failed
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

export enum NotificationRelatedType {
  COMMUNITY = 'community',
  EVENT = 'event',
  CHAT_MESSAGE = 'chat_message',
  DISCUSSION = 'discussion',
  RESOURCE = 'resource',
  USER = 'user',
  ACHIEVEMENT = 'achievement',
  REPORT = 'report'
}

// ===============================
// NOTIFICATION SUB-TYPES
// ===============================

export interface NotificationAction {
  id: string;
  text: string;
  url?: string;
  action: string; // Action type for client handling
  style: 'primary' | 'secondary' | 'danger';
  data?: Record<string, unknown>; // Additional action data
}

export interface NotificationRelatedData {
  communityId?: string;
  communityName?: string;
  eventId?: string;
  eventTitle?: string;
  messageId?: string;
  discussionId?: string;
  discussionTitle?: string;
  resourceId?: string;
  resourceName?: string;
  achievementId?: string;
  achievementName?: string;
  points?: number;
  badgeId?: string;
  badgeName?: string;
  level?: number;
  position?: number; // Leaderboard position
  [key: string]: unknown; // Flexible for future additions
}

// ===============================
// NOTIFICATION PREFERENCES
// ===============================

export interface NotificationPreferences {
  userId: string;
  
  // Global Settings
  enabled: boolean;
  quietHours: QuietHours;
  
  // Channel Preferences
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    browser: boolean;
  };
  
  // Category Preferences
  categories: {
    [key in NotificationCategory]: CategoryPreference;
  };
  
  // Type-specific Preferences
  typePreferences: {
    [key in NotificationType]?: TypePreference;
  };
  
  // Community-specific Preferences
  communityPreferences: {
    [communityId: string]: CommunityNotificationPreference;
  };
  
  // Frequency Settings
  digestSettings: DigestSettings;
  
  // System Fields
  updatedAt: Timestamp;
}

export interface CategoryPreference {
  enabled: boolean;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  immediateOnly: boolean; // Skip digest for this category
}

export interface TypePreference {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface CommunityNotificationPreference {
  communityId: string;
  enabled: boolean;
  chatMessages: boolean;
  discussions: boolean;
  events: boolean;
  announcements: boolean;
  newMembers: boolean;
  channels: NotificationChannel[];
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  weekdaysOnly: boolean;
}

export interface DigestSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  time: string; // HH:MM format
  timezone: string;
  categories: NotificationCategory[];
  minItems: number; // Minimum items to send digest
}

// ===============================
// NOTIFICATION TEMPLATES
// ===============================

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  
  // Template Content
  titleTemplate: string;
  messageTemplate: string;
  shortMessageTemplate?: string;
  
  // Template Variables
  variables: TemplateVariable[];
  
  // Default Settings
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions: NotificationAction[];
  
  // Conditions
  conditions?: TemplateCondition[];
  
  // Localization
  localization: {
    [locale: string]: {
      titleTemplate: string;
      messageTemplate: string;
      shortMessageTemplate?: string;
    };
  };
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
  action: 'show' | 'hide' | 'modify_priority' | 'modify_channels';
}

// ===============================
// NOTIFICATION BATCHING & GROUPING
// ===============================

export interface NotificationBatch {
  id: string;
  userId: string;
  type: NotificationType;
  groupId: string;
  
  // Batch Info
  notifications: string[]; // Notification IDs
  count: number;
  
  // Merged Content
  title: string;
  message: string;
  
  // Status
  status: 'pending' | 'sent' | 'delivered';
  
  // Timing
  createdAt: Timestamp;
  scheduledFor: Timestamp;
  sentAt?: Timestamp;
  
  // Settings
  maxBatchSize: number;
  batchWindow: number; // Minutes to wait for more notifications
}

export interface NotificationGroup {
  id: string;
  userId: string;
  type: NotificationType;
  relatedId: string;
  relatedType: NotificationRelatedType;
  
  // Grouping Rules
  groupBy: string[]; // Fields to group by
  maxAge: number; // Max age in minutes
  maxCount: number; // Max notifications in group
  
  // Current State
  notifications: string[]; // Notification IDs
  count: number;
  lastNotificationAt: Timestamp;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===============================
// REAL-TIME NOTIFICATION TYPES
// ===============================

export interface LiveNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  
  // Real-time Data
  timestamp: Timestamp;
  relatedId?: string;
  relatedType?: NotificationRelatedType;
  
  // Display Settings
  duration?: number; // Auto-dismiss after X seconds
  persistent: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  
  // Actions
  actions?: NotificationAction[];
  
  // Styling
  variant: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
}

export interface NotificationSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Timestamp;
  lastUsed?: Timestamp;
  isActive: boolean;
}

// ===============================
// NOTIFICATION ANALYTICS
// ===============================

export interface NotificationAnalytics {
  userId?: string; // If user-specific
  communityId?: string; // If community-specific
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Delivery Metrics
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  
  // Engagement Metrics
  totalRead: number;
  totalClicked: number;
  totalDismissed: number;
  readRate: number;
  clickRate: number;
  
  // Channel Breakdown
  channelMetrics: {
    [key in NotificationChannel]: {
      sent: number;
      delivered: number;
      failed: number;
      read: number;
      clicked: number;
    };
  };
  
  // Type Breakdown
  typeMetrics: {
    [key in NotificationType]?: {
      sent: number;
      read: number;
      clicked: number;
    };
  };
  
  // Category Breakdown
  categoryMetrics: {
    [key in NotificationCategory]: {
      sent: number;
      read: number;
      clicked: number;
    };
  };
  
  // Time-based Analytics
  hourlyMetrics: HourlyMetric[];
  dailyMetrics: DailyMetric[];
  
  // User Engagement
  topUsers?: UserEngagementMetric[];
  
  lastUpdated: Timestamp;
}

export interface HourlyMetric {
  hour: number; // 0-23
  sent: number;
  read: number;
  clicked: number;
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  sent: number;
  read: number;
  clicked: number;
}

export interface UserEngagementMetric {
  userId: string;
  userName: string;
  totalReceived: number;
  totalRead: number;
  totalClicked: number;
  engagementScore: number;
}

// ===============================
// NOTIFICATION CONTEXT TYPES
// ===============================

export interface NotificationContextType {
  // Current State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Live Notifications
  liveNotifications: LiveNotification[];
  
  // Notification Management
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Fetching
  fetchNotifications: (limit?: number, offset?: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Preferences
  preferences: NotificationPreferences | null;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Real-time
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  
  // Push Notifications
  requestPushPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<void>;
  unsubscribeFromPush: () => Promise<void>;
  
  // Analytics
  trackNotificationClick: (notificationId: string) => void;
  trackNotificationView: (notificationId: string) => void;
}

// ===============================
// NOTIFICATION CREATION TYPES
// ===============================

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  
  // Optional Fields
  shortMessage?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  
  // Related Data
  relatedId?: string;
  relatedType?: NotificationRelatedType;
  relatedData?: NotificationRelatedData;
  
  // Sender Info
  senderId?: string;
  
  // Actions
  actionUrl?: string;
  actionText?: string;
  actions?: NotificationAction[];
  
  // Delivery
  channels?: NotificationChannel[];
  scheduledFor?: Timestamp;
  expiresAt?: Timestamp;
  
  // Grouping
  groupId?: string;
}

export interface BulkNotificationRequest {
  userIds: string[];
  notification: Omit<CreateNotificationRequest, 'userId'>;
  
  // Bulk-specific Options
  batchSize?: number;
  delayBetweenBatches?: number; // Seconds
  respectUserPreferences?: boolean;
}