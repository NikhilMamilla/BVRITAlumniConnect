// ===========================
// DISCUSSION.TYPES.TS
// Complete Discussion & Q&A System Types
// ===========================

import { Timestamp } from 'firebase/firestore';

// ===========================
// ENUMS & CONSTANTS
// ===========================

export enum DiscussionType {
  QUESTION = 'question',
  GENERAL_DISCUSSION = 'general_discussion',
  HELP_REQUEST = 'help_request',
  TUTORIAL = 'tutorial',
  RESOURCE_SHARING = 'resource_sharing',
  PROJECT_SHOWCASE = 'project_showcase',
  ANNOUNCEMENT = 'announcement',
  POLL = 'poll',
  CHALLENGE = 'challenge',
  INTERVIEW_EXPERIENCE = 'interview_experience',
  CAREER_ADVICE = 'career_advice',
  TECH_NEWS = 'tech_news'
}

export enum DiscussionStatus {
  ACTIVE = 'active',
  SOLVED = 'solved',
  CLOSED = 'closed',
  PINNED = 'pinned',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  PENDING_APPROVAL = 'pending_approval',
  DRAFT = 'draft'
}

export enum DiscussionPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote'
}

export enum ReplyType {
  ANSWER = 'answer',
  COMMENT = 'comment',
  CLARIFICATION = 'clarification',
  FOLLOW_UP = 'follow_up'
}

export enum DiscussionCategory {
  // Technical Categories
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MOBILE = 'mobile',
  DEVOPS = 'devops',
  DATABASE = 'database',
  ALGORITHMS = 'algorithms',
  SYSTEM_DESIGN = 'system_design',
  
  // Career Categories
  INTERNSHIP = 'internship',
  PLACEMENT = 'placement',
  CAREER_SWITCH = 'career_switch',
  SALARY_NEGOTIATION = 'salary_negotiation',
  INTERVIEW_PREP = 'interview_prep',
  
  // Learning Categories
  LEARNING_PATH = 'learning_path',
  CERTIFICATION = 'certification',
  BOOTCAMP = 'bootcamp',
  SELF_STUDY = 'self_study',
  
  // Project Categories
  OPEN_SOURCE = 'open_source',
  SIDE_PROJECT = 'side_project',
  STARTUP = 'startup',
  FREELANCING = 'freelancing',
  
  // General Categories
  NETWORKING = 'networking',
  MENTORSHIP = 'mentorship',
  EVENTS = 'events',
  GENERAL = 'general'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// ===========================
// CORE DISCUSSION INTERFACES
// ===========================

export interface Discussion {
  id: string;
  communityId: string;
  
  // Basic Information
  title: string;
  content: string;
  htmlContent?: string; // Rich text HTML version
  rawContent?: string;  // Original markdown content
  excerpt: string;      // Auto-generated summary
  
  // Classification
  type: DiscussionType;
  category: DiscussionCategory;
  tags: string[];
  difficulty?: DifficultyLevel;
  priority: DiscussionPriority;
  
  // Author Information
  authorId: string;
  authorInfo: {
    displayName: string;
    photoURL?: string;
    role: 'student' | 'alumni' | 'admin';
    reputation: number;
    badge?: string;
    graduationYear?: number;
    department?: string;
  };
  
  // Status & Lifecycle
  status: DiscussionStatus;
  isLocked: boolean;
  lockedBy?: string;
  lockedReason?: string;
  lockedAt?: Timestamp;
  
  // Engagement Metrics
  viewCount: number;
  uniqueViewers: string[]; // User IDs for unique view tracking
  voteScore: number;       // Net votes (upvotes - downvotes)
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  answerCount: number;     // Replies marked as answers
  
  // Voting Details
  votes: DiscussionVote[];
  voterIds: string[];      // For quick vote checking
  
  // Best Answer (for questions)
  bestAnswerId?: string;
  bestAnswerSelectedBy?: string;
  bestAnswerSelectedAt?: Timestamp;
  hasBestAnswer: boolean;
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  isFlagged: boolean;
  flaggedReason?: string;
  flaggedBy?: string;
  flaggedAt?: Timestamp;
  
  // Special Flags
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Timestamp;
  pinnedReason?: string;
  isFeatured: boolean;
  featuredBy?: string;
  featuredAt?: Timestamp;
  
  // Activity Tracking
  lastActivityAt: Timestamp;
  lastActivityBy: string;
  lastActivityType: 'created' | 'replied' | 'voted' | 'edited' | 'status_changed';
  
  // Hot/Trending Algorithm Factors
  hotScore: number;        // Algorithm-calculated trending score
  trendingScore: number;   // Trending in timeframe
  qualityScore: number;    // Content quality score
  
  // SEO & Search
  slug: string;            // URL-friendly identifier
  searchableContent: string; // Processed content for search
  keywords: string[];      // Extracted keywords
  
  // Attachments & Media
  attachments: DiscussionAttachment[];
  hasAttachments: boolean;
  
  // Code Snippets
  codeSnippets: CodeSnippetDiscussion[];
  hasCodeSnippets: boolean;
  
  // External Links
  externalLinks: ExternalLink[];
  hasExternalLinks: boolean;
  
  // Follow/Subscribe
  followers: string[];     // User IDs following this discussion
  followerCount: number;
  isFollowedByAuthor: boolean;
  
  // Related Discussions
  relatedDiscussionIds: string[];
  duplicateOf?: string;    // If marked as duplicate
  
  // Analytics
  engagementRate: number;  // Calculated engagement metric
  responseTime: number;    // Average time to first response (minutes)
  resolutionTime?: number; // Time to get best answer (minutes)
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastEditedAt?: Timestamp;
  lastEditedBy?: string;
  
  // Client-side fields
  isBookmarked?: boolean;  // User-specific bookmark status
  userVote?: VoteType;     // Current user's vote
  isFollowing?: boolean;   // User-specific follow status
  readBy?: string[];       // Users who have read this discussion
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  communityId: string;
  
  // Basic Information
  content: string;
  htmlContent?: string;
  rawContent?: string;
  
  // Classification
  type: ReplyType;
  
  // Author Information
  authorId: string;
  authorInfo: {
    displayName: string;
    photoURL?: string;
    role: 'student' | 'alumni' | 'admin';
    reputation: number;
    badge?: string;
    isExpert: boolean;     // Subject matter expert
  };
  
  // Threading
  parentReplyId?: string;  // For nested replies
  depth: number;           // Nesting level (0 = top-level)
  childReplies: string[];  // Child reply IDs
  childCount: number;      // Number of direct children
  
  // Engagement
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  votes: ReplyVote[];
  voterIds: string[];
  
  // Answer Status
  isAcceptedAnswer: boolean;
  acceptedBy?: string;     // Discussion author who accepted
  acceptedAt?: Timestamp;
  isBestAnswer: boolean;   // Community-voted best answer
  
  // Quality Metrics
  helpfulVotes: number;    // "This was helpful" votes
  qualityScore: number;    // Algorithm-calculated quality
  isHighQuality: boolean;
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  isFlagged: boolean;
  flaggedReason?: string;
  isHidden: boolean;
  hiddenBy?: string;
  hiddenReason?: string;
  
  // Special Flags
  isPinned: boolean;       // Pinned within discussion
  pinnedBy?: string;
  isOfficial: boolean;     // Official response from moderator/expert
  
  // Attachments & Media
  attachments: ReplyAttachment[];
  codeSnippets: CodeSnippetReply[];
  externalLinks: ExternalLink[];
  
  // Mentions
  mentions: ReplyMention[];
  mentionedUsers: string[];
  
  // Edit History
  isEdited: boolean;
  editCount: number;
  lastEditedAt?: Timestamp;
  lastEditedBy?: string;
  editHistory: EditHistory[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Client-side fields
  userVote?: VoteType;
  isBookmarked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface DiscussionVote {
  id: string;
  discussionId: string;
  userId: string;
  userInfo: {
    displayName: string;
    photoURL?: string;
    reputation: number;
  };
  type: VoteType;
  weight: number;          // Vote weight based on user reputation
  createdAt: Timestamp;
}

export interface ReplyVote {
  id: string;
  replyId: string;
  userId: string;
  userInfo: {
    displayName: string;
    reputation: number;
  };
  type: VoteType;
  weight: number;
  createdAt: Timestamp;
}

// ===========================
// ATTACHMENT & MEDIA INTERFACES
// ===========================

export interface DiscussionAttachment {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'archive';
  size: number;
  mimeType: string;
  
  // Image/Video specific
  width?: number;
  height?: number;
  duration?: number;
  
  // Upload metadata
  uploadedBy: string;
  uploadedAt: Timestamp;
  isProcessed: boolean;
  processingError?: string;
  
  // Security
  isScanned: boolean;
  scanResult?: 'clean' | 'malware' | 'suspicious';
}

export interface ReplyAttachment extends DiscussionAttachment {
  replyId: string;
}

export interface CodeSnippetDiscussion {
  id: string;
  language: string;
  code: string;
  filename?: string;
  description?: string;
  isRunnable: boolean;
  
  // Syntax highlighting
  highlightedLines?: number[];
  theme: 'light' | 'dark';
  
  // Metadata
  lineCount: number;
  characterCount: number;
  
  // Engagement
  likeCount: number;
  copyCount: number;      // How many times copied
  runCount?: number;      // How many times executed
  
  createdAt: Timestamp;
}

export interface CodeSnippetReply extends CodeSnippetDiscussion {
  replyId: string;
}

export interface ExternalLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  
  // Link analysis
  isWorking: boolean;
  lastChecked?: Timestamp;
  responseTime?: number;
  
  // User interaction
  clickCount: number;
  
  createdAt: Timestamp;
}

// ===========================
// MENTION & NOTIFICATION INTERFACES
// ===========================

export interface ReplyMention {
  id: string;
  userId: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
  isNotified: boolean;
  notifiedAt?: Timestamp;
}

export interface DiscussionNotification {
  id: string;
  userId: string;
  discussionId: string;
  replyId?: string;       // If notification is for a reply
  
  // Notification details
  type: 'new_reply' | 'mention' | 'vote' | 'best_answer' | 'follow_activity' | 'status_change';
  title: string;
  message: string;
  
  // Context
  triggeredBy: string;    // User ID who triggered the notification
  triggeredByInfo: {
    displayName: string;
    photoURL?: string;
  };
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // Actions
  actionUrl: string;
  actionText: string;
  
  createdAt: Timestamp;
}

// ===========================
// SEARCH & FILTERING INTERFACES
// ===========================

export interface DiscussionSearchParams {
  query?: string;
  communityId?: string;
  authorId?: string;
  type?: DiscussionType;
  category?: DiscussionCategory;
  status?: DiscussionStatus;
  tags?: string[];
  difficulty?: DifficultyLevel;
  hasAcceptedAnswer?: boolean;
  hasAttachments?: boolean;
  hasCodeSnippets?: boolean;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  lastActivityAfter?: Date;
  lastActivityBefore?: Date;
  
  // Engagement filters
  minVotes?: number;
  maxVotes?: number;
  minReplies?: number;
  maxReplies?: number;
  minViews?: number;
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'voteScore' | 'replyCount' | 'viewCount' | 'hotScore' | 'trendingScore';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface DiscussionSearchResult {
  discussion: Discussion;
  relevanceScore: number;
  highlightedTitle: string;
  highlightedContent: string;
  matchedTags: string[];
  
  // Context
  bestReply?: DiscussionReply;
  recentReplies: DiscussionReply[];
}

export interface DiscussionFilter {
  id: string;
  name: string;
  userId: string;
  communityId?: string;
  
  // Filter criteria
  criteria: Partial<DiscussionSearchParams>;
  
  // Settings
  isDefault: boolean;
  isPublic: boolean;      // Can be used by other users
  useCount: number;       // How many times used
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===========================
// ANALYTICS & METRICS INTERFACES
// ===========================

export interface DiscussionAnalytics {
  discussionId: string;
  communityId: string;
  
  // View Analytics
  totalViews: number;
  uniqueViews: number;
  averageTimeSpent: number; // seconds
  bounceRate: number;       // percentage
  
  // Engagement Analytics
  totalVotes: number;
  totalReplies: number;
  engagementRate: number;
  responseRate: number;     // percentage of discussions that get replies
  
  // Quality Metrics
  qualityScore: number;
  helpfulnessScore: number;
  resolutionRate: number;   // for questions
  
  // Time Analytics
  averageResponseTime: number; // minutes to first reply
  averageResolutionTime?: number; // minutes to accepted answer
  
  // User Analytics
  participantCount: number;
  expertParticipation: boolean;
  alumniParticipation: boolean;
  
  // Performance Metrics
  hotScore: number;
  trendingScore: number;
  viralityScore: number;    // sharing/referral rate
  
  // Time-based metrics
  viewsByDay: Record<string, number>;     // YYYY-MM-DD -> views
  engagementByHour: Record<string, number>; // hour -> engagement
  
  lastCalculated: Timestamp;
}

export interface CommunityDiscussionMetrics {
  communityId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  
  // Volume Metrics
  totalDiscussions: number;
  totalReplies: number;
  activeDiscussions: number;
  solvedDiscussions: number;
  
  // Quality Metrics
  averageQualityScore: number;
  highQualityDiscussions: number;
  averageResponseTime: number;
  resolutionRate: number;
  
  // Engagement Metrics
  totalVotes: number;
  totalViews: number;
  uniqueParticipants: number;
  averageRepliesPerDiscussion: number;
  
  // Category Distribution
  discussionsByCategory: Record<DiscussionCategory, number>;
  discussionsByType: Record<DiscussionType, number>;
  
  // User Metrics
  topContributors: {
    userId: string;
    displayName: string;
    discussionCount: number;
    replyCount: number;
    voteScore: number;
  }[];
  
  // Popular Content
  mostViewedDiscussions: string[];      // Discussion IDs
  mostVotedDiscussions: string[];       // Discussion IDs
  trendingDiscussions: string[];        // Discussion IDs
  
  generatedAt: Timestamp;
}

// ===========================
// MODERATION & QUALITY INTERFACES
// ===========================

export interface DiscussionReport {
  id: string;
  discussionId?: string;
  replyId?: string;
  
  // Report details
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'duplicate' | 'off_topic' | 'other';
  description: string;
  category: string;
  
  // Reporter info
  reportedBy: string;
  reporterInfo: {
    displayName: string;
    reputation: number;
  };
  
  // Status
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  resolution?: string;
  
  // Actions taken
  actionTaken?: 'none' | 'warning' | 'content_removal' | 'user_suspension' | 'content_edit';
  actionDetails?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QualityAssessment {
  discussionId?: string;
  replyId?: string;
  
  // Quality factors
  contentQuality: number;     // 0-100
  relevance: number;          // 0-100
  helpfulness: number;        // 0-100
  clarity: number;            // 0-100
  completeness: number;       // 0-100
  
  // Technical factors
  hasCodeExamples: boolean;
  hasExternalReferences: boolean;
  hasProperFormatting: boolean;
  wordCount: number;
  readabilityScore: number;
  
  // Community factors
  communityVotes: number;
  expertEndorsements: number;
  
  // Overall score
  overallScore: number;       // Weighted combination
  qualityTier: 'low' | 'medium' | 'high' | 'excellent';
  
  calculatedAt: Timestamp;
}

export interface EditHistory {
  id: string;
  editedBy: string;
  editedAt: Timestamp;
  reason?: string;
  previousContent: string;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

// ===========================
// UTILITY & HELPER TYPES
// ===========================

export type DiscussionCreateData = Omit<Discussion, 
  'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'uniqueViewers' | 
  'voteScore' | 'upvoteCount' | 'downvoteCount' | 'replyCount' | 
  'votes' | 'voterIds' | 'lastActivityAt' | 'hotScore' | 'trendingScore' |
  'qualityScore' | 'followers' | 'followerCount' | 'engagementRate' |
  'responseTime' | 'searchableContent' | 'keywords'
>;

export type DiscussionUpdateData = Partial<Pick<Discussion,
  'title' | 'content' | 'htmlContent' | 'rawContent' | 'category' | 
  'tags' | 'difficulty' | 'priority' | 'status' | 'attachments' |
  'codeSnippets' | 'externalLinks'
>>;

export type ReplyCreateData = Omit<DiscussionReply,
  'id' | 'createdAt' | 'updatedAt' | 'voteScore' | 'upvoteCount' |
  'downvoteCount' | 'votes' | 'voterIds' | 'qualityScore' |
  'helpfulVotes' | 'childReplies' | 'childCount' | 'editHistory'
>;

export type ReplyUpdateData = Partial<Pick<DiscussionReply,
  'content' | 'htmlContent' | 'rawContent' | 'type' | 'attachments' |
  'codeSnippets' | 'externalLinks'
>>;

// Pagination cursors
export interface DiscussionCursor {
  discussionId: string;
  sortValue: unknown; // Value used for sorting (timestamp, vote count, etc.)
  direction: 'before' | 'after';
}

export interface DiscussionPage {
  discussions: Discussion[];
  replies?: Record<string, DiscussionReply[]>; // discussionId -> replies
  hasMore: boolean;
  nextCursor?: DiscussionCursor;
  previousCursor?: DiscussionCursor;
  total: number;
}

// Real-time subscription types
export type DiscussionSubscriptionType = 
  'discussions' | 'replies' | 'votes' | 'status_changes' | 'new_content';

export interface DiscussionSubscription {
  type: DiscussionSubscriptionType;
  communityId?: string;
  discussionId?: string;
  callback: (data: unknown) => void;
  filters?: Record<string, unknown>;
}