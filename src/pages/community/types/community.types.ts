// src/pages/community/types/community.types.ts

import { Timestamp } from 'firebase/firestore';
import {
  BaseDocument,
  EntityStatus,
  VisibilityLevel,
  ModerationStatus,
  FirestoreTimestamp,
  MediaFile,
  MetricData,
  UserRole,
  UserReference,
} from './common.types';
import { ChatMessage } from './chat.types';

// ==================== CORE COMMUNITY TYPES ====================
export interface Community extends BaseDocument {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  avatar?: string;
  banner?: string;
  color?: string;
  emoji?: string;
  category: CommunityCategory;
  tags: string[];
  skills: string[];
  visibility: VisibilityLevel;
  joinApproval: JoinApprovalType;
  memberLimit?: number;
  allowInvites: boolean;
  allowResourceSharing: boolean;
  allowEvents: boolean;
  guidelines: string;
  rules: CommunityRule[];
  welcomeMessage?: string;
  owner: UserReference;
  moderators: string[]; 
  admins: string[];
  status: EntityStatus;
  memberCount: number;
  activeMembers: number;
  messageCount: number;
  discussionCount: number;
  resourceCount: number;
  eventCount: number;
  engagementScore: number;
  growthRate: number;
  lastActivity: Timestamp;
  features: CommunityFeatures;
  settings: CommunitySettings;
  moderationStatus: ModerationStatus;
  flagCount: number;
  searchKeywords: string[];
  isArchived: boolean;
  archiveReason?: string;
  onlineMembers: number;
  recentActivity: RecentActivity[];
  updatedBy: string;
  privacy: 'public' | 'private';
}

// ==================== COMMUNITY ENUMS & UNIONS ====================
export enum CommunityCategory {
  TECHNOLOGY = 'technology',
  CAREER = 'career',
  ACADEMICS = 'academics',
  PROJECTS = 'projects',
  INTERNSHIPS = 'internships',
  PLACEMENTS = 'placements',
  RESEARCH = 'research',
  INNOVATION = 'innovation',
  ENTREPRENEURSHIP = 'entrepreneurship',
  SOCIAL = 'social',
  SPORTS = 'sports',
  ARTS = 'arts',
  VOLUNTEER = 'volunteer',
  MENTORSHIP = 'mentorship',
  GENERAL = 'general'
}

export enum JoinApprovalType {
  OPEN = 'open',
  APPROVAL = 'approval_required',
  INVITE_ONLY = 'invite_only'
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  autoEnforce: boolean;
  violations: number;
  createdAt: FirestoreTimestamp;
}

export type RuleSeverity = 'low' | 'medium' | 'high' | 'critical';

// ==================== COMMUNITY FEATURES & SETTINGS ====================
export interface CommunityFeatures {
  chat: boolean;
  discussions: boolean;
  resources: boolean;
  events: boolean;
  polls: boolean;
  announcements: boolean;
  gamification: boolean;
  analytics: boolean;
  integrations: boolean;
  customRoles: boolean;
  privateChannels: boolean;
  voiceChat: boolean;
  liveStreaming: boolean;
  fileSharing: boolean;
  codeSharing: boolean;
  projectCollaboration: boolean;
}

export interface CommunitySettings {
  // Notification Settings
  notifications: {
    newMembers: boolean;
    newMessages: boolean;
    newDiscussions: boolean;
    newResources: boolean;
    newEvents: boolean;
    mentions: boolean;
    announcements: boolean;
  };
  
  // Moderation Settings
  moderation: {
    autoModeration: boolean;
    requireApprovalForResources: boolean;
    requireApprovalForEvents: boolean;
    allowMemberInvites: boolean;
    allowGuestMessages: boolean;
    messageRetentionDays?: number;
    profanityFilter: boolean;
    spamDetection: boolean;
  };
  
  // Privacy Settings
  privacy: {
    showMemberList: boolean;
    showMemberActivity: boolean;
    allowSearchIndexing: boolean;
    requireProfileCompletion: boolean;
  };
  
  // Integration Settings
  integrations: {
    github: boolean;
    discord: boolean;
    slack: boolean;
    calendar: boolean;
    drive: boolean;
  };
  
  // Custom Settings
  custom: Record<string, unknown>;
  requireApproval?: boolean;
}

// ==================== COMMUNITY ACTIVITY ====================
export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: FirestoreTimestamp;
  metadata?: Record<string, unknown>;
  relatedId?: string; // ID of related message, discussion, etc.
}

export type ActivityType = 
  | 'member_joined' | 'member_left' | 'member_promoted'
  | 'message_posted' | 'discussion_created' | 'discussion_replied'
  | 'resource_shared' | 'event_created' | 'event_updated'
  | 'announcement_posted' | 'poll_created' | 'community_updated'
  | 'milestone_reached' | 'achievement_unlocked';

// ==================== COMMUNITY MEMBERSHIP ====================
export interface CommunityMember extends BaseDocument {
  // Identity
  communityId: string;
  userId: string;
  userDetails: UserReference;
  
  // Membership Info
  role: CommunityRole;
  customTitle?: string;
  joinedAt: FirestoreTimestamp;
  invitedBy?: string;
  joinReason?: string;
  
  // Status & Permissions
  status: MemberStatus;
  permissions?: CommunityPermission[];
  
  // Activity & Engagement
  lastSeen: FirestoreTimestamp;
  lastActiveAt?: FirestoreTimestamp;
  messageCount: number;
  discussionCount: number;
  resourceCount: number;
  helpfulVotes: number;
  
  // Gamification
  points: number;
  level: number;
  badges?: MemberBadge[];
  achievements?: MemberAchievement[];
  streak: number; // Days of consecutive activity
  
  // Preferences
  notifications?: MemberNotificationSettings;
  displayPreferences?: MemberDisplayPreferences;
  
  // Moderation
  warnings: number;
  violations?: ModerationViolation[];
  isMuted: boolean;
  muteExpires?: FirestoreTimestamp;
  
  // Analytics
  engagementScore: number;
  influenceScore: number;
  helpfulness: number;
  
  // Metadata
  tags?: string[]; // Member-specific tags
  notes?: string; // Admin/moderator notes
  lastActivity?: FirestoreTimestamp;
  metadata?: { isFounder: boolean; invitedBy: string | null; joinMethod: string; inviteMessage?: string | null };
}

export type CommunityRole = 
  | 'member' | 'contributor' | 'moderator' 
  | 'admin' | 'owner' | 'alumni_mentor';

export type MemberStatus = 
  | 'active' | 'inactive' | 'pending' | 'suspended' 
  | 'banned' | 'left' | 'kicked';

export interface CommunityPermission {
  action: string;
  granted: boolean;
  grantedBy?: string;
  grantedAt?: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
}

// ==================== MEMBER GAMIFICATION ====================
export interface MemberBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
  earnedAt: FirestoreTimestamp;
  progress?: number;
  maxProgress?: number;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MemberAchievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  points: number;
  unlockedAt: FirestoreTimestamp;
  requirements?: AchievementRequirement[];
}

export type AchievementCategory = 
  | 'participation' | 'helpfulness' | 'leadership' 
  | 'creativity' | 'collaboration' | 'milestone';

export interface AchievementRequirement {
  type: RequirementType;
  target: number;
  current: number;
  completed: boolean;
}

export type RequirementType = 
  | 'messages_sent' | 'discussions_started' | 'helpful_votes'
  | 'resources_shared' | 'events_attended' | 'days_active';

// ==================== MEMBER PREFERENCES ====================
export interface MemberNotificationSettings {
  // Real-time notifications
  mentions: boolean;
  replies: boolean;
  directMessages: boolean;
  announcements: boolean;
  
  // Activity notifications
  newMessages: boolean;
  newDiscussions: boolean;
  newResources: boolean;
  newEvents: boolean;
  newMembers: boolean;
  
  // Gamification notifications
  achievements: boolean;
  badges: boolean;
  levelUp: boolean;
  leaderboard: boolean;
  
  // Delivery preferences
  push: boolean;
  email: boolean;
  inApp: boolean;
  
  // Frequency settings
  immediate: boolean;
  daily: boolean;
  weekly: boolean;
  
  // Do not disturb
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
}

export interface MemberDisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Privacy preferences
  showOnlineStatus: boolean;
  showActivity: boolean;
  showProfile: boolean;
  allowDirectMessages: boolean;
  
  // UI preferences
  compactMode: boolean;
  showAvatars: boolean;
  showEmoji: boolean;
  autoPlayMedia: boolean;
  soundEffects: boolean;
  animations: boolean;
  
  // Content preferences
  hideNSFW: boolean;
  filterProfanity: boolean;
  showPreview: boolean;
}

// ==================== MODERATION ====================
export interface ModerationViolation {
  id: string;
  type: ViolationType;
  description: string;
  severity: RuleSeverity;
  reportedBy: string;
  reportedAt: FirestoreTimestamp;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: FirestoreTimestamp;
  action?: ModerationAction;
  evidence?: ModerationEvidence[];
}

export type ViolationType = 
  | 'spam' | 'harassment' | 'inappropriate_content'
  | 'hate_speech' | 'doxxing' | 'impersonation'
  | 'copyright' | 'off_topic' | 'self_promotion'
  | 'misinformation' | 'rule_violation';

export interface ModerationAction {
  type: ActionType;
  duration?: number; // in minutes
  reason: string;
  actionBy: string;
  actionAt: FirestoreTimestamp;
  appealable: boolean;
}

export type ActionType = 
  | 'warning' | 'mute' | 'temporary_ban' 
  | 'permanent_ban' | 'kick' | 'content_removal'
  | 'role_removal' | 'restriction';

export interface ModerationEvidence {
  type: 'message' | 'image' | 'file' | 'link' | 'screenshot';
  content: string;
  timestamp: FirestoreTimestamp;
  context?: string;
}

// ==================== COMMUNITY ANALYTICS ====================
export interface CommunityAnalytics {
  communityId: string;
  period: {
    start: FirestoreTimestamp;
    end: FirestoreTimestamp;
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  studentsCount: number;
}

export interface TopMemberMetric {
  userId: string;
  userName: string;
  userAvatar?: string;
  metric: string;
  value: number;
  rank: number;
}

export interface TopContentMetric {
  contentId: string;
  contentType: string;
  title: string;
  metric: string;
  value: number;
  rank: number;
}

export interface AnalyticsInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  trend: 'positive' | 'negative' | 'neutral';
  value: number;
  change: number;
}

export type InsightType = 
  | 'growth_spike' | 'engagement_drop' | 'member_churn'
  | 'content_trend' | 'activity_pattern' | 'popular_topic';

export interface AnalyticsRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: string[];
  deadline?: FirestoreTimestamp;
}

export type RecommendationType = 
  | 'increase_engagement' | 'improve_retention' | 'boost_growth'
  | 'enhance_content' | 'optimize_moderation' | 'feature_adoption';

// ==================== COMMUNITY SEARCH & DISCOVERY ====================
export interface CommunitySearchResult {
  community: Community;
  relevanceScore: number;
  matchedFields: string[];
  highlightedText?: Record<string, string>;
}

export interface CommunityFilter {
  categories?: CommunityCategory[];
  memberCount?: {
    min?: number;
    max?: number;
  };
  activityLevel?: ActivityLevel;
  joinType?: JoinApprovalType[];
  features?: string[];
  tags?: string[];
  departments?: string[];
  hasRecentActivity?: boolean;
  isVerified?: boolean;
  createdBy?: string;
  isActive?: boolean;
  includeArchived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export type ActivityLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// ==================== COMMUNITY INVITATIONS ====================
export interface CommunityInvitation extends BaseDocument {
  communityId: string;
  communityName: string;
  invitedBy: UserReference;
  invitedUser?: UserReference; // For specific user invitations
  invitedEmail?: string; // For email invitations
  
  invitationType: InvitationType;
  role: CommunityRole;
  message?: string;
  
  status: InvitationStatus;
  expiresAt: FirestoreTimestamp;
  
  // Usage tracking
  viewCount: number;
  lastViewed?: FirestoreTimestamp;
  
  // Metadata
  inviteCode?: string; // For shareable invite links
  maxUses?: number;
  usedCount: number;
}

export type InvitationType = 'direct' | 'email' | 'link' | 'bulk';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

// ==================== UTILITY TYPES ====================
export type CommunityWithMembershipStatus = Community & {
  membershipStatus: MembershipStatus;
  userRole?: CommunityRole;
  joinedAt?: FirestoreTimestamp;
  canJoin: boolean;
  joinRestriction?: string;
};

export type MembershipStatus = 
  | 'not_member' | 'pending' | 'member' | 'moderator' 
  | 'admin' | 'owner' | 'banned' | 'invited';

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  messages: number;
  totalDiscussions: number;
  totalResources: number;
  totalEvents: number;
  engagementRate: number;
  growthRate: number;
  retentionRate: number;
  averageMessageLength: number;
  peakOnlineMembers: number;
  lastUpdated: FirestoreTimestamp;
  settings: Partial<CommunitySettings>;
}

export interface CommunityPreview {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  category: CommunityCategory;
  memberCount: number;
  onlineMembers: number;
  lastActivity: FirestoreTimestamp;
  tags: string[];
  isVerified: boolean;
  engagementScore: number;
}

// ==================== CREATE/UPDATE TYPES ====================
export interface CreateCommunityData {
  name: string;
  description: string;
  longDescription?: string;
  category: CommunityCategory;
  tags: string[];
  skills: string[];
  visibility: VisibilityLevel;
  joinApproval: JoinApprovalType;
  memberLimit?: number;
  guidelines?: string;
  welcomeMessage?: string;
  avatar?: string;
  banner?: string;
  color?: string;
  emoji?: string;
  features: Partial<CommunityFeatures>;
  settings: Partial<CommunitySettings>;
}

export interface UpdateCommunityData extends Partial<CreateCommunityData> {
  id: string;
}

export interface JoinCommunityData {
  communityId: string;
  joinReason?: string;
  agreeToGuidelines: boolean;
  invitedBy?: string;
  joinMethod?: string;
}

export interface LeaveCommunityData {
  communityId: string;
  reason?: string;
  feedback?: string;
}

export interface CommunityWithLastMessage extends Community {
  lastMessage: ChatMessage | null;
}