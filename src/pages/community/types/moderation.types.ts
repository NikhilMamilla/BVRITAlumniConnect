// ================================================================================================
// MODERATION TYPES - BVRIT Alumni-Student Connect Platform
// Real-time Community Moderation System
// ================================================================================================

import { Timestamp } from 'firebase/firestore';

// ================================================================================================
// CORE MODERATION TYPES
// ================================================================================================

export type ModerationAction = 
  | 'warn'
  | 'mute'
  | 'kick'
  | 'ban'
  | 'delete_message'
  | 'delete_discussion'
  | 'delete_resource'
  | 'approve_resource'
  | 'reject_resource'
  | 'pin_message'
  | 'unpin_message'
  | 'lock_discussion'
  | 'unlock_discussion'
  | 'feature_discussion'
  | 'unfeature_discussion'
  | 'restrict_posting'
  | 'unrestrict_posting';

export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'offensive_language'
  | 'plagiarism'
  | 'misinformation'
  | 'copyright_violation'
  | 'irrelevant_content'
  | 'promotional_content'
  | 'impersonation'
  | 'security_threat'
  | 'other';

export type ReportStatus = 
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed'
  | 'escalated';

export type ModeratorRole = 
  | 'community_admin'      // Full permissions
  | 'community_moderator'  // Most permissions
  | 'content_moderator'    // Content-specific permissions
  | 'event_moderator';     // Event-specific permissions

export type ViolationSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ModerationLogType = 
  | 'user_action'
  | 'automated_action'
  | 'system_action'
  | 'report_filed'
  | 'report_resolved';

// ================================================================================================
// REPORT INTERFACES
// ================================================================================================

export interface Report {
  id: string;
  communityId: string;
  reporterId: string;
  reportedUserId: string;
  targetId: string; // ID of reported content (message, discussion, resource, etc.)
  targetType: 'message' | 'discussion' | 'resource' | 'user' | 'event';
  reason: ReportReason;
  customReason?: string;
  description: string;
  evidence?: ReportEvidence[];
  status: ReportStatus;
  severity: ViolationSeverity;
  assignedModeratorId?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  resolutionNotes?: string;
  actionTaken?: ModerationAction;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
    deviceInfo?: string;
  };
}

export interface ReportEvidence {
  type: 'screenshot' | 'text' | 'url' | 'file';
  content: string;
  description?: string;
  timestamp: Timestamp;
}

export interface BulkReport {
  id: string;
  reportIds: string[];
  communityId: string;
  reportedUserId: string;
  totalReports: number;
  mostCommonReason: ReportReason;
  createdAt: Timestamp;
  status: ReportStatus;
  assignedModeratorId?: string;
}

// ================================================================================================
// USER MODERATION INTERFACES
// ================================================================================================

export interface UserModerationRecord {
  userId: string;
  communityId: string;
  warnings: Warning[];
  violations: Violation[];
  restrictions: UserRestriction[];
  totalWarnings: number;
  totalViolations: number;
  reputationScore: number;
  isBanned: boolean;
  banExpiry?: Timestamp;
  banReason?: string;
  isMuted: boolean;
  muteExpiry?: Timestamp;
  muteReason?: string;
  isRestricted: boolean;
  restrictionExpiry?: Timestamp;
  restrictionType?: RestrictionType;
  lastViolationAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Warning {
  id: string;
  reason: string;
  issuedBy: string;
  issuedAt: Timestamp;
  acknowledged: boolean;
  acknowledgedAt?: Timestamp;
  severity: ViolationSeverity;
  relatedReportId?: string;
}

export interface Violation {
  id: string;
  type: ReportReason;
  description: string;
  actionTaken: ModerationAction;
  issuedBy: string;
  issuedAt: Timestamp;
  severity: ViolationSeverity;
  relatedReportId: string;
  appealStatus?: AppealStatus;
  appealedAt?: Timestamp;
}

export interface UserRestriction {
  id: string;
  type: RestrictionType;
  reason: string;
  duration?: number; // in hours
  expiresAt?: Timestamp;
  issuedBy: string;
  issuedAt: Timestamp;
  isActive: boolean;
  relatedViolationId?: string;
}

export type RestrictionType = 
  | 'no_posting'
  | 'no_messaging'
  | 'no_resource_upload'
  | 'no_event_creation'
  | 'read_only'
  | 'limited_interactions';

export type AppealStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'denied';

// ================================================================================================
// CONTENT MODERATION INTERFACES
// ================================================================================================

export interface ContentModerationRule {
  id: string;
  communityId: string;
  name: string;
  description: string;
  type: ContentRuleType;
  isActive: boolean;
  autoAction?: ModerationAction;
  severity: ViolationSeverity;
  criteria: ModerationCriteria;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ContentRuleType = 
  | 'keyword_filter'
  | 'spam_detection'
  | 'link_restriction'
  | 'image_moderation'
  | 'rate_limiting'
  | 'content_length'
  | 'regex_pattern';

export interface ModerationCriteria {
  keywords?: string[];
  bannedDomains?: string[];
  allowedDomains?: string[];
  regexPatterns?: string[];
  maxContentLength?: number;
  minContentLength?: number;
  rateLimit?: {
    maxActions: number;
    timeWindow: number; // in minutes
  };
  autoModeration?: {
    enabled: boolean;
    confidence: number; // 0-100
  };
}

export interface AutoModerationResult {
  id: string;
  contentId: string;
  contentType: 'message' | 'discussion' | 'resource';
  communityId: string;
  userId: string;
  ruleName: string;
  ruleId: string;
  confidence: number;
  actionTaken: ModerationAction;
  flaggedContent: string;
  reason: string;
  timestamp: Timestamp;
  reviewRequired: boolean;
  humanReviewed: boolean;
  humanReviewedBy?: string;
  humanReviewedAt?: Timestamp;
  overridden: boolean;
  overrideReason?: string;
}

// ================================================================================================
// MODERATOR INTERFACES
// ================================================================================================

export interface Moderator {
  id: string;
  userId: string;
  communityId: string;
  role: ModeratorRole;
  permissions: ModeratorPermission[];
  assignedBy: string;
  assignedAt: Timestamp;
  isActive: boolean;
  lastActiveAt?: Timestamp;
  actionsCount: number;
  reportsHandled: number;
  averageResponseTime: number; // in minutes
  performance: ModeratorPerformance;
}

export type ModeratorPermission = 
  | 'view_reports'
  | 'handle_reports'
  | 'delete_content'
  | 'warn_users'
  | 'mute_users'
  | 'ban_users'
  | 'manage_resources'
  | 'manage_events'
  | 'pin_content'
  | 'lock_discussions'
  | 'view_analytics'
  | 'manage_moderators'
  | 'edit_community'
  | 'delete_community';

export interface ModeratorPerformance {
  totalActions: number;
  reportsResolved: number;
  averageResolutionTime: number;
  userSatisfactionRating: number;
  escalationRate: number;
  overrideRate: number;
  lastEvaluatedAt: Timestamp;
}

export interface ModeratorAction {
  id: string;
  moderatorId: string;
  communityId: string;
  action: ModerationAction;
  targetId: string;
  targetType: 'user' | 'message' | 'discussion' | 'resource' | 'event';
  targetUserId?: string;
  reason: string;
  duration?: number; // for temporary actions (mute, ban)
  expiresAt?: Timestamp;
  notes?: string;
  relatedReportId?: string;
  timestamp: Timestamp;
  metadata?: {
    previousAction?: ModerationAction;
    appealable: boolean;
    notificationSent: boolean;
  };
}

// ================================================================================================
// MODERATION QUEUE INTERFACES
// ================================================================================================

export interface ModerationQueue {
  id: string;
  communityId: string;
  type: QueueType;
  priority: QueuePriority;
  items: QueueItem[];
  assignedModerators: string[];
  stats: QueueStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type QueueType = 
  | 'reports'
  | 'auto_flagged'
  | 'appeals'
  | 'resource_approval'
  | 'user_verification';

export type QueuePriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface QueueItem {
  id: string;
  type: string;
  targetId: string;
  priority: QueuePriority;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  createdAt: Timestamp;
  dueDate?: Timestamp;
  estimatedProcessingTime?: number;
}

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  inProgressItems: number;
  completedItems: number;
  averageProcessingTime: number;
  oldestItemAge: number;
}

// ================================================================================================
// MODERATION LOG INTERFACES
// ================================================================================================

export interface ModerationLog {
  id: string;
  communityId: string;
  type: ModerationLogType;
  action: string;
  performedBy: string;
  targetId?: string;
  targetType?: string;
  targetUserId?: string;
  details: LogDetails;
  timestamp: Timestamp;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

export interface LogDetails {
  description: string;
  previousState?: unknown;
  newState?: unknown;
  reason?: string;
  duration?: number;
  automaticAction: boolean;
  confidence?: number;
  appealable: boolean;
}

export interface ModerationAnalytics {
  communityId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  stats: {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    falseReports: number;
    autoModerationActions: number;
    manualModerationActions: number;
    usersBanned: number;
    usersMuted: number;
    usersWarned: number;
    contentDeleted: number;
    averageResolutionTime: number;
  };
  trends: {
    reportsByReason: Record<ReportReason, number>;
    actionsByType: Record<ModerationAction, number>;
    violationsBySeverity: Record<ViolationSeverity, number>;
  };
  moderatorPerformance: Record<string, ModeratorPerformance>;
  createdAt: Timestamp;
}

// ================================================================================================
// APPEAL INTERFACES
// ================================================================================================

export interface Appeal {
  id: string;
  userId: string;
  communityId: string;
  violationId: string;
  moderationActionId: string;
  reason: string;
  description: string;
  evidence?: ReportEvidence[];
  status: AppealStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  decision?: AppealDecision;
  decisionReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AppealDecision = 
  | 'upheld'        // Original action maintained
  | 'overturned'    // Original action reversed
  | 'modified';     // Original action modified

export interface AppealReview {
  id: string;
  appealId: string;
  reviewerId: string;
  decision: AppealDecision;
  reasoning: string;
  evidence?: ReportEvidence[];
  newAction?: ModerationAction;
  reviewedAt: Timestamp;
}

// ================================================================================================
// COMMUNITY MODERATION SETTINGS
// ================================================================================================

export interface CommunityModerationSettings {
  communityId: string;
  autoModeration: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    actions: {
      spam: ModerationAction;
      toxicity: ModerationAction;
      inappropriateContent: ModerationAction;
    };
  };
  reportThresholds: {
    autoAction: number;
    escalation: number;
    communityAlert: number;
  };
  userRestrictions: {
    maxWarningsBeforeMute: number;
    maxViolationsBeforeBan: number;
    defaultMuteDuration: number; // hours
    defaultBanDuration: number; // hours
  };
  contentRules: {
    maxMessageLength: number;
    allowedFileTypes: string[];
    maxFileSize: number; // MB
    requireApproval: boolean;
    bannedKeywords: string[];
  };
  moderatorSettings: {
    requireApprovalForBans: boolean;
    allowAppealReviews: boolean;
    autoAssignReports: boolean;
    maxReportsPerModerator: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ================================================================================================
// UTILITY INTERFACES
// ================================================================================================

export interface ModerationMetrics {
  responseTime: number;
  accuracyRate: number;
  userSatisfaction: number;
  escalationRate: number;
  autoModerationEffectiveness: number;
  communityHealth: number;
}

export interface RealTimeModerationEvent {
  type: 'report_created' | 'action_taken' | 'appeal_filed' | 'queue_updated';
  communityId: string;
  data: unknown;
  timestamp: Timestamp;
  moderatorId?: string;
}

// ================================================================================================
// FORM INTERFACES
// ================================================================================================

export interface CreateReportForm {
  targetId: string;
  targetType: 'message' | 'discussion' | 'resource' | 'user' | 'event';
  reason: ReportReason;
  customReason?: string;
  description: string;
  evidence?: File[];
}

export interface ModeratorActionForm {
  action: ModerationAction;
  reason: string;
  duration?: number;
  notes?: string;
  notifyUser: boolean;
  appealable: boolean;
}

export interface AppealForm {
  reason: string;
  description: string;
  evidence?: File[];
}

// ================================================================================================
// API RESPONSE INTERFACES
// ================================================================================================

export interface ModerationApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Timestamp;
}

export interface PaginatedModerationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ================================================================================================
// EXPORT ALL TYPES
// ================================================================================================

export type {
  // Core types already exported above
};

// Type guards for runtime type checking
export const isValidModerationAction = (action: string): action is ModerationAction => {
  return [
    'warn', 'mute', 'kick', 'ban', 'delete_message', 'delete_discussion',
    'delete_resource', 'approve_resource', 'reject_resource', 'pin_message',
    'unpin_message', 'lock_discussion', 'unlock_discussion', 'feature_discussion',
    'unfeature_discussion', 'restrict_posting', 'unrestrict_posting'
  ].includes(action);
};

export const isValidReportReason = (reason: string): reason is ReportReason => {
  return [
    'spam', 'harassment', 'inappropriate_content', 'offensive_language',
    'plagiarism', 'misinformation', 'copyright_violation', 'irrelevant_content',
    'promotional_content', 'impersonation', 'security_threat', 'other'
  ].includes(reason);
};

export const isValidModeratorRole = (role: string): role is ModeratorRole => {
  return ['community_admin', 'community_moderator', 'content_moderator', 'event_moderator'].includes(role);
};