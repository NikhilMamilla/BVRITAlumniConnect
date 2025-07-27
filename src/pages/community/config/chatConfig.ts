// chatConfig.ts
// Centralized, advanced, Firestore-compliant configuration for all chat features
// Covers messages, threads, presence, typing, reactions, moderation, analytics, notifications, and more

import { COLLECTIONS, FIELDS, DEFAULT_LIMITS } from '../utils/constants';
import { MessageType, MessageStatus, ReactionType, ThreadType, AttachmentType, MentionType } from '../types/chat.types';
import { NotificationType, NotificationCategory, NotificationPriority } from '../types/notification.types';
import { ResourceType, ResourceStatus, ResourceVisibility } from '../types/resource.types';
import type { ModerationAction, ReportStatus, ModeratorRole } from '../types/moderation.types';
import type { CommunityRole } from '../types/community.types';

/**
 * ==================== CHAT CONFIGURATION ====================
 * All values are real-time, type-safe, and compliant with Firestore rules and indexes.
 */

export const chatConfig = {
  // --- Firestore Collection Names ---
  collections: {
    chatMessages: 'chatMessages',
    chatThreads: 'chatThreads',
    chatRooms: 'chatRooms',
    typingIndicators: 'typingIndicators',
    onlinePresence: 'onlinePresence',
    chatNotifications: 'chatNotifications',
    attachments: COLLECTIONS.ATTACHMENTS,
    members: COLLECTIONS.MEMBERS,
    communities: COLLECTIONS.COMMUNITIES,
    analytics: COLLECTIONS.ANALYTICS,
  },

  // --- Real-time Feature Toggles ---
  features: {
    chat: true,
    threads: true,
    reactions: true,
    pin: true,
    bookmark: true,
    presence: true,
    typingIndicators: true,
    moderation: true,
    analytics: true,
    notifications: true,
    attachments: true,
    search: true,
    filters: true,
    polls: true,
    codeSnippets: true,
    linkPreviews: true,
    slowMode: true,
    autoModeration: true,
    liveActivity: true,
    export: false,
    import: false,
  },

  // --- Firestore Index Hints (for query optimization) ---
  firestoreIndexes: {
    chatMessages: [
      'communityId', 'createdAt', 'isPinned', 'isDeleted', 'authorId', 'type', 'reactions', 'editedAt', 'mentions', 'threadId', 'status', 'isAnnouncement', 'isSystemMessage', 'isWelcomeMessage', 'tags', 'searchableContent'
    ],
    chatThreads: [
      'communityId', 'createdAt', 'type', 'isActive', 'participantIds', 'lastReplyAt', 'starterUserId'
    ],
    chatRooms: [
      'communityId', 'createdAt', 'name', 'onlineCount', 'activeUsers', 'settings', 'moderationSettings', 'lastMessageAt'
    ],
    typingIndicators: [
      'communityId', 'userId', 'isTyping', 'startedAt', 'expiresAt'
    ],
    onlinePresence: [
      'communityId', 'userId', 'status', 'lastSeen', 'deviceType', 'currentChannel', 'isOnline', 'sessionId', 'connectedAt'
    ],
    chatNotifications: [
      'userId', 'communityId', 'type', 'createdAt', 'isRead', 'priority'
    ],
    attachments: [
      'communityId', 'uploadedBy', 'type', 'size', 'uploadedAt', 'isScanned', 'scanResult', 'metadata.format', 'metadata.quality'
    ],
  },

  // --- Chat Limits & Expiry ---
  limits: {
    maxMessageLength: 2000,
    maxAttachmentSizeMB: 25,
    maxAttachmentsPerMessage: 10,
    maxReactionsPerMessage: 50,
    maxPinnedMessages: 100,
    maxBookmarkedMessages: 1000,
    maxThreadsPerRoom: 1000,
    maxMessagesPerMinute: 30,
    slowModeIntervalSec: 10,
    typingIndicatorExpiryMs: 5000,
    presenceUpdateIntervalSec: 10,
    messageRetentionDays: 365,
    threadRetentionDays: 365,
    notificationRetentionDays: 30,
    analyticsRetentionDays: 365,
    ...DEFAULT_LIMITS,
  },

  // --- Chat Statuses, Types, and Enums ---
  messageTypes: Object.values(MessageType),
  messageStatuses: Object.values(MessageStatus),
  reactionTypes: Object.values(ReactionType),
  threadTypes: Object.values(ThreadType),
  attachmentTypes: Object.values(AttachmentType),
  mentionTypes: Object.values(MentionType),
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

  // --- Chat Analytics & Monitoring ---
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