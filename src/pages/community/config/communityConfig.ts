// communityConfig.ts
// Centralized, advanced, Firestore-compliant configuration for communities
// Covers all real-time, policy, and index-driven settings for the platform

import { CommunityCategory, CommunityRole, CommunitySettings, CommunityFeatures, RuleSeverity, JoinApprovalType } from '../types/community.types';
import { CommunityModerationSettings } from '../types/moderation.types';
import { CommunityMemberConfig } from '../types/member.types';
import { COLLECTIONS } from '../utils/constants';

/**
 * ==================== COMMUNITY CONFIGURATION ====================
 * This config is used for validation, UI, and Firestore operations.
 * All values are real-time, type-safe, and compliant with Firestore rules and indexes.
 */

export const communityConfig = {
  // --- Firestore Collection Names ---
  collections: COLLECTIONS,

  // --- Community Creation & Update Policies ---
  requiredFields: [
    'name', 'description', 'category', 'owner', 'createdAt', 'status', 'visibility', 'memberCount', 'features', 'settings', 'isArchived', 'onlineMembers', 'recentActivity'
  ], // Must match Firestore rules
  maxNameLength: 100,
  maxDescriptionLength: 500,
  maxLongDescriptionLength: 5000,
  maxTags: 10,
  maxSkills: 20,
  maxRules: 20,
  maxGuidelinesLength: 2000,
  maxWelcomeMessageLength: 1000,
  allowedCategories: [
    'technology', 'career', 'academics', 'projects', 'internships', 'placements', 'research', 'innovation', 'entrepreneurship', 'social', 'sports', 'arts', 'volunteer', 'mentorship', 'general'
  ] as CommunityCategory[],
  allowedVisibilities: ['public', 'private', 'restricted'],
  allowedJoinApproval: ['open', 'approval_required', 'invite_only'] as JoinApprovalType[],
  maxMemberLimit: 10000, // Should match Firestore and business logic
  minMemberLimit: 2,
  maxAdmins: 10,
  maxModerators: 20,
  maxCustomRoles: 10,

  // --- Membership & Join Policies ---
  /**
   * Global member policy config (not a full CommunityMemberConfig, which is per-community and runtime)
   */
  member: {
    defaultRole: 'member' as CommunityRole,
    allowedRoles: [
      'member', 'contributor', 'moderator', 'admin', 'owner', 'alumni_mentor'
    ] as CommunityRole[],
    maxInvitesPerUser: 20,
    maxPendingInvites: 100,
    joinApprovalTypes: ['open', 'approval_required', 'invite_only'] as JoinApprovalType[],
    maxJoinReasonLength: 500,
    maxNotesLength: 1000,
    maxBadges: 50,
    maxAchievements: 50,
    maxStreak: 365,
    maxWarnings: 10,
    maxViolations: 20,
    maxMuteDurationHours: 168, // 1 week
    maxBanDurationHours: 8760, // 1 year
    retentionPeriodDays: 365,
  },

  // --- Moderation & Content Policies ---
  moderation: {
    autoModeration: {
      enabled: true,
      sensitivity: 'medium',
      actions: {
        spam: 'mute',
        toxicity: 'warn',
        inappropriateContent: 'ban',
      },
    },
    reportThresholds: {
      autoAction: 3,
      escalation: 5,
      communityAlert: 10,
    },
    userRestrictions: {
      maxWarningsBeforeMute: 3,
      maxViolationsBeforeBan: 5,
      defaultMuteDuration: 24, // hours
      defaultBanDuration: 168, // hours
    },
    contentRules: {
      maxMessageLength: 2000,
      allowedFileTypes: [
        'image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'application/zip', 'text/plain', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ],
      maxFileSize: 25, // MB
      requireApproval: false,
      bannedKeywords: ['spam', 'scam', 'offensive'],
    },
    moderatorSettings: {
      requireApprovalForBans: true,
      allowAppealReviews: true,
      autoAssignReports: true,
      maxReportsPerModerator: 20,
    },
  } as CommunityModerationSettings,

  // --- Feature Toggles (Default Features) ---
  features: {
    chat: true,
    discussions: true,
    resources: true,
    events: true,
    polls: true,
    announcements: true,
    gamification: true,
    analytics: true,
    integrations: false,
    customRoles: false,
    privateChannels: false,
    voiceChat: false,
    liveStreaming: false,
    fileSharing: true,
    codeSharing: false,
    projectCollaboration: false,
  } as CommunityFeatures,

  // --- Default Settings (Matches Firestore rules and service logic) ---
  settings: {
    notifications: {
      newMembers: true,
      newMessages: true,
      newDiscussions: true,
      newResources: true,
      newEvents: true,
      mentions: true,
      announcements: true,
    },
    moderation: {
      autoModeration: false,
      requireApprovalForResources: false,
      requireApprovalForEvents: false,
      allowMemberInvites: true,
      allowGuestMessages: false,
      profanityFilter: true,
      spamDetection: true,
    },
    privacy: {
      showMemberList: true,
      showMemberActivity: true,
      allowSearchIndexing: true,
      requireProfileCompletion: false,
    },
    integrations: {
      github: false,
      discord: false,
      slack: false,
      calendar: false,
      drive: false,
    },
    custom: {},
  } as CommunitySettings,

  // --- Analytics & Engagement ---
  analytics: {
    minEngagementScore: 0,
    maxEngagementScore: 100,
    minGrowthRate: -100,
    maxGrowthRate: 1000,
    minRetentionRate: 0,
    maxRetentionRate: 100,
    minSatisfactionScore: 0,
    maxSatisfactionScore: 10,
  },

  // --- Real-time Features ---
  realTime: {
    presence: true,
    typingIndicators: true,
    liveActivity: true,
    onlineMemberUpdateInterval: 10, // seconds
    recentActivityLimit: 50,
  },

  // --- Firestore Index Hints (for query optimization) ---
  firestoreIndexes: {
    communities: [
      'isActive', 'createdAt', 'memberCount', 'lastActivity', 'category', 'tags', 'privacy', 'moderators', 'owner', 'status', 'engagementScore', 'growthRate', 'archiveReason', 'onlineMembers', 'recentActivity'
    ],
    communityMembers: [
      'communityId', 'userId', 'role', 'isActive', 'joinedAt', 'lastSeen', 'points', 'level', 'badges', 'achievements', 'streak', 'engagementScore', 'influenceScore', 'helpfulness', 'lastActivity'
    ],
    chatMessages: [
      'communityId', 'isPinned', 'mentions', 'createdAt', 'isDeleted', 'senderId', 'messageType', 'reactions', 'editedAt'
    ],
    discussions: [
      'communityId', 'isPinned', 'isResolved', 'category', 'tags', 'createdAt', 'lastActivity', 'upvotes'
    ],
    resources: [
      'communityId', 'category', 'fileType', 'tags', 'createdAt', 'downloadCount', 'uploadedBy', 'isApproved'
    ],
    notifications: [
      'userId', 'communityId', 'type', 'createdAt', 'isRead'
    ],
    moderationReports: [
      'communityId', 'reportedUserId', 'status', 'createdAt'
    ],
    moderationActions: [
      'communityId', 'actionType', 'createdAt'
    ],
    communityAnalytics: [
      'communityId', 'date', 'metricType'
    ],
    typingIndicators: [
      'communityId', 'userId', 'lastTyped'
    ],
    onlinePresence: [
      'communityId', 'userId', 'lastSeen'
    ],
  },

  // --- Extensibility & Customization ---
  custom: {},
}; 