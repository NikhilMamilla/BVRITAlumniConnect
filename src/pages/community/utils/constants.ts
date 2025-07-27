// constants.ts
// Centralized, advanced, Firestore-compliant constants for the community platform

// ==================== FIRESTORE COLLECTIONS & FIELDS ====================
export const COLLECTIONS = {
  USERS: 'users',
  COMMUNITIES: 'communities',
  MEMBERS: 'members',
  MODERATION_REPORTS: 'moderationReports',
  MODERATION_ACTIONS: 'moderationActions',
  COMMUNITY_BANS: 'communityBans',
  COMMUNITY_MODERATORS: 'communityModerators',
  MODERATION_LOGS: 'moderationLogs',
  MODERATION_ANALYTICS: 'moderationAnalytics',
  MODERATION_SETTINGS: 'moderationSettings',
  MODERATION_EVENTS: 'moderationEvents',
  USER_MODERATION_RECORDS: 'userModerationRecords',
  RATE_LIMITS: 'rateLimits',
  NOTIFICATIONS: 'notifications',
  RESOURCES: 'resources',
  CHATS: 'chats',
  MESSAGES: 'messages',
  ATTACHMENTS: 'attachments',
  ANALYTICS: 'communityAnalytics',
  GAMIFICATION: 'gamification',
  BADGES: 'badges',
  CHALLENGES: 'challenges',
  LEADERBOARD: 'leaderboard',
};

export const FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  USER_ID: 'userId',
  COMMUNITY_ID: 'communityId',
  STATUS: 'status',
  ROLE: 'role',
  PERMISSIONS: 'permissions',
  ACTION: 'action',
  TIMESTAMP: 'timestamp',
  IS_ACTIVE: 'isActive',
  EXPIRES_AT: 'expiresAt',
  ASSIGNED_AT: 'assignedAt',
  ASSIGNED_BY: 'assignedBy',
};

// ==================== STATUS, ROLES, PERMISSIONS ====================
export const MEMBER_STATUSES = [
  'active', 'inactive', 'pending', 'banned', 'suspended', 'deleted',
] as const;
export type MemberStatus = typeof MEMBER_STATUSES[number];

export const COMMUNITY_ROLES = [
  'member', 'contributor', 'moderator', 'admin', 'owner', 'alumni_mentor',
] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

export const USER_ROLES = [
  'student', 'alumni', 'admin',
] as const;
export type UserRole = typeof USER_ROLES[number];

export const MODERATOR_ROLES = [
  'community_admin', 'community_moderator', 'content_moderator', 'event_moderator',
] as const;
export type ModeratorRole = typeof MODERATOR_ROLES[number];

export const PERMISSION_ACTIONS = [
  'create', 'read', 'update', 'delete', 'moderate', 'admin', 'invite', 'ban',
  'pin', 'announce', 'manage_events', 'approve_resources', 'view_analytics',
  'delete_message', 'delete_discussion', 'delete_resource', 'feature_discussion',
  'restrict_posting', 'unrestrict_posting',
] as const;
export type PermissionAction = typeof PERMISSION_ACTIONS[number];

export const PERMISSION_RESOURCES = [
  'community', 'message', 'discussion', 'resource', 'event', 'member', 'notification',
] as const;
export type PermissionResource = typeof PERMISSION_RESOURCES[number];

// ==================== DEFAULT LIMITS & PAGINATION ====================
export const DEFAULT_LIMITS = {
  MAX_FILE_SIZE_MB: 100,
  MAX_FILES_PER_UPLOAD: 10,
  MAX_COMMUNITY_MEMBERS: 10000,
  MAX_COMMUNITIES_PER_USER: 20,
  MAX_MESSAGES_PER_MINUTE: 30,
  MAX_NOTIFICATIONS_PER_DAY: 100,
  PAGINATION_LIMIT: 20,
  SEARCH_LIMIT: 20,
  RATE_LIMIT_WINDOW_MINUTES: 1,
  RATE_LIMIT_ACTIONS: 30,
};

// ==================== ERROR CODES & MESSAGES ====================
export const ERROR_CODES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_INPUT: 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  TIMEOUT: 'TIMEOUT',
};

export const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',
  INVALID_INPUT: 'Invalid input provided.',
  RATE_LIMIT_EXCEEDED: 'You have exceeded the allowed rate limit.',
  NETWORK_ERROR: 'A network error occurred. Please try again.',
  UPLOAD_FAILED: 'File upload failed.',
  PROCESSING_ERROR: 'An error occurred while processing your request.',
  TIMEOUT: 'The request timed out.',
};

// ==================== REGEX PATTERNS & VALIDATION ====================
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  BVRIT_EMAIL: /^[0-9]{2}211[aA][0-9]{4}@bvrit.ac.in$/,
  COLLEGE_ID_NEW: /^\d{2}211A\d{4}$/i,
  COLLEGE_ID_OLD: /^BVRIT\d{4}CS\d{3}$/i,
  URL: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
};

// ==================== DEFAULTS & MISC ====================
export const DEFAULTS = {
  COMMUNITY_AVATAR: '/images/default-community.png',
  USER_AVATAR: '/images/default-user.png',
  NOTIFICATION_ICON: '/images/notification-icon.png',
  SYSTEM_USER_ID: 'system',
  SYSTEM_USER_NAME: 'System',
};

// ==================== ANALYTICS & GAMIFICATION ====================
export const ANALYTICS_EVENTS = [
  'user_joined', 'user_left', 'message_sent', 'resource_uploaded',
  'discussion_created', 'event_created', 'notification_sent',
] as const;
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[number];

export const GAMIFICATION = {
  POINTS_PER_MESSAGE: 1,
  POINTS_PER_RESOURCE: 5,
  BADGE_NEW_MEMBER: 'new_member',
  BADGE_TOP_CONTRIBUTOR: 'top_contributor',
  BADGE_HELPER: 'helper',
}; 