// realtimeConfig.ts
// Centralized, advanced, Firestore-compliant configuration for all real-time features
// Covers presence, typing, events, analytics, notifications, moderation, resources, and more

import { COLLECTIONS, FIELDS, DEFAULT_LIMITS } from '../utils/constants';
import type { RealtimeEventType, PresenceStatus } from '../types/common.types';
import { NotificationType, NotificationCategory, NotificationPriority } from '../types/notification.types';
import { ResourceType, ResourceStatus, ResourceVisibility } from '../types/resource.types';
import type { ModerationAction, ReportStatus, ModeratorRole } from '../types/moderation.types';
import type { CommunityRole } from '../types/community.types';

/**
 * ==================== REAL-TIME CONFIGURATION ====================
 * All values are real-time, type-safe, and compliant with Firestore rules and indexes.
 */

export const realtimeConfig = {
  // --- Firestore Collection Names ---
  collections: {
    presence: 'onlinePresence',
    typing: 'typingIndicators',
    events: 'realtimeEvents',
    chatMessages: 'chatMessages',
    notifications: COLLECTIONS.NOTIFICATIONS,
    analytics: COLLECTIONS.ANALYTICS,
    moderationReports: COLLECTIONS.MODERATION_REPORTS,
    moderationActions: COLLECTIONS.MODERATION_ACTIONS,
    moderationLogs: COLLECTIONS.MODERATION_LOGS,
    resources: COLLECTIONS.RESOURCES,
    members: COLLECTIONS.MEMBERS,
    communities: COLLECTIONS.COMMUNITIES,
    files: COLLECTIONS.ATTACHMENTS,
  },

  // --- Real-time Feature Toggles ---
  features: {
    presence: true,
    typingIndicators: true,
    liveEvents: true,
    chat: true,
    notifications: true,
    analytics: true,
    moderation: true,
    resources: true,
    fileUploads: true,
    memberStatus: true,
    onlineMemberTracking: true,
    realTimeSearch: true,
    liveActivity: true,
    eventStreaming: false, // Enable if you have live video/events
  },

  // --- Firestore Index Hints (for query optimization) ---
  firestoreIndexes: {
    onlinePresence: [
      'communityId', 'userId', 'status', 'lastSeen', 'deviceType', 'currentPage', 'isOnline', 'sessionId', 'connectedAt'
    ],
    typingIndicators: [
      'communityId', 'userId', 'isTyping', 'startedAt', 'expiresAt'
    ],
    realtimeEvents: [
      'communityId', 'type', 'timestamp', 'userId'
    ],
    chatMessages: [
      'communityId', 'createdAt', 'isPinned', 'isDeleted', 'senderId', 'messageType', 'reactions', 'editedAt', 'mentions'
    ],
    notifications: [
      'userId', 'communityId', 'type', 'category', 'status', 'createdAt', 'isRead', 'priority'
    ],
    analytics: [
      'communityId', 'userId', 'period', 'date', 'metricType', 'generatedAt'
    ],
    moderationReports: [
      'communityId', 'reportedUserId', 'status', 'createdAt', 'severity', 'assignedModeratorId'
    ],
    moderationActions: [
      'communityId', 'action', 'targetId', 'targetType', 'moderatorId', 'timestamp'
    ],
    moderationLogs: [
      'communityId', 'type', 'action', 'performedBy', 'timestamp'
    ],
    resources: [
      'communityId', 'type', 'category', 'status', 'approvalStatus', 'uploadedBy', 'createdAt', 'isPinned', 'isFeatured', 'tags'
    ],
    members: [
      'communityId', 'userId', 'role', 'status', 'isOnline', 'joinedAt', 'lastSeen', 'points', 'level', 'badges', 'achievements', 'streak', 'engagementScore', 'influenceScore', 'helpfulness', 'lastActivity'
    ],
    communities: [
      'isActive', 'createdAt', 'memberCount', 'lastActivity', 'category', 'tags', 'privacy', 'moderators', 'owner', 'status', 'engagementScore', 'growthRate', 'archiveReason', 'onlineMembers', 'recentActivity'
    ],
    files: [
      'communityId', 'uploadedBy', 'type', 'size', 'uploadedAt', 'metadata.format', 'metadata.quality'
    ],
  },

  // --- Real-time Limits & Expiry ---
  limits: {
    maxOnlineMembers: 10000,
    maxTypingIndicators: 1000,
    typingIndicatorExpiryMs: 5000, // 5 seconds
    presenceUpdateIntervalSec: 10,
    maxRealtimeEvents: 1000,
    eventRetentionDays: 7,
    maxLiveNotifications: 100,
    notificationRetentionDays: 30,
    maxRealtimeResources: 10000,
    resourceRetentionDays: 365,
    maxRealtimeModerationLogs: 10000,
    moderationLogRetentionDays: 365,
    maxRealtimeAnalytics: 10000,
    analyticsRetentionDays: 365,
    maxRealtimeFiles: 10000,
    fileRetentionDays: 365,
    ...DEFAULT_LIMITS,
  },

  // --- Real-time Statuses, Types, and Enums ---
  presenceStatuses: ['online', 'away', 'busy', 'offline'] as PresenceStatus[],
  typingIndicatorFields: ['userId', 'communityId', 'displayName', 'photoURL', 'startedAt', 'expiresAt'],
  realtimeEventTypes: [
    'message_created', 'message_updated', 'message_deleted',
    'user_joined', 'user_left', 'user_typing', 'user_stopped_typing',
    'discussion_created', 'discussion_updated', 'discussion_deleted',
    'member_added', 'member_removed', 'member_role_changed',
    'community_updated', 'event_created', 'resource_shared',
    'notification_sent', 'presence_updated',
  ] as RealtimeEventType[],
  notificationTypes: Object.values(NotificationType),
  notificationCategories: Object.values(NotificationCategory),
  notificationPriorities: Object.values(NotificationPriority),
  resourceTypes: Object.values(ResourceType),
  resourceStatuses: Object.values(ResourceStatus),
  resourceVisibilities: Object.values(ResourceVisibility),
  moderationActions: [
    'warn', 'mute', 'kick', 'ban', 'delete_message', 'delete_discussion',
    'delete_resource', 'approve_resource', 'reject_resource', 'pin_message',
    'unpin_message', 'lock_discussion', 'unlock_discussion', 'feature_discussion',
    'unfeature_discussion', 'restrict_posting', 'unrestrict_posting',
  ] as ModerationAction[],
  reportStatuses: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'] as ReportStatus[],
  moderatorRoles: [
    'community_admin', 'community_moderator', 'content_moderator', 'event_moderator'
  ] as ModeratorRole[],
  communityRoles: [
    'member', 'contributor', 'moderator', 'admin', 'owner', 'alumni_mentor'
  ] as CommunityRole[],

  // --- Real-time Analytics & Monitoring ---
  analytics: {
    enableLiveMetrics: true,
    enableEngagementTracking: true,
    enablePerformanceTracking: true,
    enableAlerts: true,
    minEngagementScore: 0,
    maxEngagementScore: 100,
    minGrowthRate: -100,
    maxGrowthRate: 1000,
    minRetentionRate: 0,
    maxRetentionRate: 100,
    minSatisfactionScore: 0,
    maxSatisfactionScore: 10,
  },

  // --- Extensibility & Customization ---
  custom: {},
}; 