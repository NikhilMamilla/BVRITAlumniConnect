import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE ANALYTICS INTERFACES
// ============================================================================

/**
 * Base analytics interface with common tracking fields
 */
export interface BaseAnalytics {
  id: string;
  timestamp: Timestamp;
  communityId: string;
  userId: string;
  userRole: 'student' | 'alumni';
  metadata?: Record<string, unknown>;
}

/**
 * Analytics aggregation periods
 */
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Analytics metrics types
 */
export type MetricType = 
  | 'engagement' 
  | 'growth' 
  | 'activity' 
  | 'retention' 
  | 'content' 
  | 'performance';

// ============================================================================
// COMMUNITY ANALYTICS
// ============================================================================

/**
 * Community analytics overview
 */
export interface CommunityAnalytics {
  communityId: string;
  period: {
    start: Timestamp;
    end: Timestamp;
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
  studentsCount: number;
  alumniCount: number;
  newMembersCount: number;
  activeMembersCount: number;
  totalMessages: number;
  totalDiscussions: number;
  totalResources: number;
  totalEvents: number;
  messagesPerDay: number;
  discussionsPerDay: number;
  resourcesPerDay: number;
  eventsPerDay: number;
  averageResponseTime: number;
  resolutionRate: number;
  satisfactionScore: number;
  memberGrowthRate: number;
  engagementGrowthRate: number;
  retentionRate: number;
  lastUpdated: Timestamp;
}

/**
 * Real-time community activity tracking
 */
export interface CommunityActivity extends BaseAnalytics {
  activityType: 
    | 'message_sent' 
    | 'discussion_created' 
    | 'discussion_replied' 
    | 'resource_shared' 
    | 'event_created' 
    | 'member_joined' 
    | 'member_left'
    | 'reaction_added'
    | 'resource_downloaded'
    | 'event_rsvp';
  
  targetId?: string; // ID of the target object (message, discussion, etc.)
  targetType?: 'message' | 'discussion' | 'resource' | 'event';
  value?: number; // For quantifiable actions
  tags?: string[];
}

/**
 * Community engagement metrics
 */
export interface CommunityEngagement {
  communityId: string;
  period: AnalyticsPeriod;
  date: Timestamp;
  
  // Message engagement
  totalMessages: number;
  uniqueMessengers: number;
  averageMessagesPerUser: number;
  peakActivityHour: number;
  
  // Discussion engagement
  totalDiscussions: number;
  totalReplies: number;
  averageRepliesPerDiscussion: number;
  discussionResolutionRate: number;
  
  // User interaction
  totalReactions: number;
  totalMentions: number;
  totalShares: number;
  
  // Resource engagement
  resourcesShared: number;
  resourcesDownloaded: number;
  resourceViewTime: number;
  
  // Event engagement
  eventsCreated: number;
  totalRSVPs: number;
  eventAttendanceRate: number;
}

// ============================================================================
// USER ANALYTICS
// ============================================================================

/**
 * Individual user analytics
 */
export interface UserAnalytics {
  userId: string;
  userRole: 'student' | 'alumni';
  period: AnalyticsPeriod;
  
  // Activity metrics
  totalMessages: number;
  totalDiscussions: number;
  totalReplies: number;
  totalResourcesShared: number;
  totalEventsCreated: number;
  
  // Engagement metrics
  communitiesJoined: number;
  communitiesActive: number; // communities with recent activity
  averageResponseTime: number;
  helpfulnessScore: number; // based on upvotes/reactions
  
  // Learning/mentoring metrics
  questionsAsked: number;
  questionsAnswered: number;
  studentsHelped?: number; // for alumni
  mentorshipSessions?: number; // for alumni
  
  // Social metrics
  connectionsCount: number;
  followersCount: number;
  profileViews: number;
  
  // Gamification
  totalPoints: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
  
  lastActive: Timestamp;
  joinDate: Timestamp;
}

/**
 * User engagement timeline
 */
export interface UserEngagementTimeline {
  userId: string;
  date: Timestamp;
  
  // Daily activity
  messagesCount: number;
  discussionsCount: number;
  repliesCount: number;
  resourcesCount: number;
  eventsCount: number;
  
  // Engagement quality
  reactionsReceived: number;
  upvotesReceived: number;
  mentionsReceived: number;
  
  // Time spent
  activeTimeMinutes: number;
  communitiesVisited: string[];
}

// ============================================================================
// CONTENT ANALYTICS
// ============================================================================

/**
 * Message analytics
 */
export interface MessageAnalytics {
  messageId: string;
  communityId: string;
  authorId: string;
  timestamp: Timestamp;
  
  // Engagement metrics
  reactionsCount: number;
  repliesCount: number;
  mentionsCount: number;
  sharesCount: number;
  
  // Content metrics
  messageLength: number;
  hasMedia: boolean;
  hasLinks: boolean;
  hasCode: boolean;
  
  // Response metrics
  responseTime?: number; // if it's a response to a question
  isHelpful?: boolean; // marked as helpful by community
  
  tags?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Discussion analytics
 */
export interface DiscussionAnalytics {
  discussionId: string;
  communityId: string;
  authorId: string;
  createdAt: Timestamp;
  
  // Engagement metrics
  viewsCount: number;
  repliesCount: number;
  upvotesCount: number;
  downvotesCount: number;
  bookmarksCount: number;
  sharesCount: number;
  
  // Resolution metrics
  isResolved: boolean;
  resolutionTime?: number; // in hours
  acceptedAnswerId?: string;
  
  // Content metrics
  category: string;
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // Quality metrics
  qualityScore: number; // 1-10 based on various factors
  helpfulnessVotes: number;
}

/**
 * Resource analytics
 */
export interface ResourceAnalytics {
  resourceId: string;
  communityId: string;
  uploaderId: string;
  uploadedAt: Timestamp;
  
  // Engagement metrics
  downloadsCount: number;
  viewsCount: number;
  bookmarksCount: number;
  sharesCount: number;
  ratingsCount: number;
  averageRating: number;
  
  // Content metrics
  fileType: string;
  fileSize: number;
  category: string;
  tags: string[];
  
  // Usage metrics
  peakDownloadHour: number;
  averageViewDuration: number;
  returnViewers: number;
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

/**
 * System performance metrics
 */
export interface PerformanceAnalytics {
  timestamp: Timestamp;
  
  // Response times
  averageMessageLoadTime: number;
  averageDiscussionLoadTime: number;
  averageResourceLoadTime: number;
  
  // Real-time performance
  averageMessageDeliveryTime: number;
  connectionStability: number; // percentage
  notificationDeliveryRate: number; // percentage
  
  // Database performance
  averageQueryTime: number;
  indexUsageRate: number;
  cacheHitRate: number;
  
  // User experience
  bounceRate: number;
  sessionDuration: number;
  pageViewsPerSession: number;
  
  // Error rates
  errorRate: number;
  timeoutRate: number;
  retryRate: number;
}

// ============================================================================
// LEADERBOARD & RANKING ANALYTICS
// ============================================================================

/**
 * Community leaderboard metrics
 */
export interface LeaderboardAnalytics {
  communityId: string;
  period: AnalyticsPeriod;
  generatedAt: Timestamp;
  
  // Top contributors
  topMessageSenders: UserRanking[];
  topDiscussionCreators: UserRanking[];
  topHelpfulMembers: UserRanking[];
  topResourceContributors: UserRanking[];
  
  // Alumni-specific rankings
  topMentors?: UserRanking[];
  topEventOrganizers?: UserRanking[];
  
  // Student-specific rankings
  topLearners?: UserRanking[];
  topQuestionAskers?: UserRanking[];
}

/**
 * User ranking interface
 */
export interface UserRanking {
  userId: string;
  userName: string;
  userRole: 'student' | 'alumni';
  score: number;
  rank: number;
  change: number; // change from previous period
  avatar?: string;
  badge?: string;
}

// ============================================================================
// TREND ANALYTICS
// ============================================================================

/**
 * Community trends analysis
 */
export interface TrendAnalytics {
  communityId: string;
  period: AnalyticsPeriod;
  analysisDate: Timestamp;
  
  // Growth trends
  memberGrowthTrend: TrendData[];
  messageVolumeTrend: TrendData[];
  engagementTrend: TrendData[];
  
  // Content trends
  popularTopics: TopicTrend[];
  emergingTags: TagTrend[];
  contentTypeTrends: ContentTypeTrend[];
  
  // User behavior trends
  peakActivityHours: number[];
  activeUsersTrend: TrendData[];
  retentionTrend: TrendData[];
  
  // Predictive insights
  predictedGrowth: number;
  riskFactors: string[];
  recommendations: string[];
}

/**
 * Trend data point
 */
export interface TrendData {
  date: Timestamp;
  value: number;
  change?: number; // percentage change from previous period
}

/**
 * Topic trend analysis
 */
export interface TopicTrend {
  topic: string;
  mentions: number;
  growth: number; // percentage growth
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedTags: string[];
}

/**
 * Tag trend analysis
 */
export interface TagTrend {
  tag: string;
  frequency: number;
  growth: number;
  associatedUsers: string[];
  relatedTopics: string[];
}

/**
 * Content type trend
 */
export interface ContentTypeTrend {
  type: 'text' | 'image' | 'video' | 'document' | 'link' | 'code';
  count: number;
  growth: number;
  engagementRate: number;
}

// ============================================================================
// ALUMNI-SPECIFIC ANALYTICS
// ============================================================================

/**
 * Alumni mentorship analytics
 */
export interface AlumniMentorshipAnalytics {
  alumniId: string;
  period: AnalyticsPeriod;
  
  // Mentorship metrics
  studentsHelped: number;
  averageResponseTime: number;
  mentorshipHours: number;
  satisfactionRating: number;
  
  // Community leadership
  communitiesLed: number;
  eventsOrganized: number;
  resourcesContributed: number;
  
  // Impact metrics
  studentSuccessStories: number;
  careerGuidanceSessions: number;
  technicalHelpProvided: number;
  
  // Recognition metrics
  mentorRating: number;
  endorsements: number;
  testimonials: number;
  
  expertiseAreas: string[];
  achievements: string[];
}

// ============================================================================
// STUDENT-SPECIFIC ANALYTICS
// ============================================================================

/**
 * Student learning analytics
 */
export interface StudentLearningAnalytics {
  studentId: string;
  period: AnalyticsPeriod;
  
  // Learning progress
  skillsLearned: string[];
  coursesCompleted: number;
  projectsShared: number;
  certificationsEarned: number;
  
  // Engagement with alumni
  mentorInteractions: number;
  guidanceReceived: number;
  networkingConnections: number;
  
  // Community participation
  questionsAsked: number;
  answersReceived: number;
  resourcesAccessed: number;
  eventsAttended: number;
  
  // Growth metrics
  skillGrowthRate: number;
  knowledgeScore: number;
  participationScore: number;
  
  learningGoals: string[];
  achievements: string[];
}

// ============================================================================
// EXPORT INTERFACES
// ============================================================================

/**
 * Analytics export configuration
 */
export interface AnalyticsExport {
  exportId: string;
  requestedBy: string;
  requestedAt: Timestamp;
  
  // Export parameters
  communityIds: string[];
  period: AnalyticsPeriod;
  startDate: Timestamp;
  endDate: Timestamp;
  metrics: MetricType[];
  
  // Export status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  downloadUrl?: string;
  expiresAt?: Timestamp;
  
  // Export metadata
  format: 'csv' | 'json' | 'pdf';
  fileSize?: number;
  recordCount?: number;
}

// ============================================================================
// REAL-TIME ANALYTICS
// ============================================================================

/**
 * Real-time analytics dashboard data
 */
export interface RealTimeAnalytics {
  timestamp: Timestamp;
  
  // Live metrics
  activeUsers: number;
  onlineUsers: string[];
  currentMessages: number;
  currentDiscussions: number;
  
  // Recent activity
  recentMessages: MessageAnalytics[];
  recentDiscussions: DiscussionAnalytics[];
  recentJoins: string[];
  
  // Performance metrics
  responseTime: number;
  throughput: number;
  errorRate: number;
  
  // Alerts
  activeAlerts: AnalyticsAlert[];
  performanceWarnings: string[];
}

/**
 * Analytics alert system
 */
export interface AnalyticsAlert {
  alertId: string;
  type: 'performance' | 'engagement' | 'growth' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  communityId?: string;
  triggeredAt: Timestamp;
  resolvedAt?: Timestamp;
  actionRequired: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  communityIds?: string[];
  userIds?: string[];
  period: AnalyticsPeriod;
  startDate: Timestamp;
  endDate: Timestamp;
  metrics: MetricType[];
  groupBy?: string[];
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Analytics response wrapper
 */
export interface AnalyticsResponse<T> {
  data: T[];
  metadata: {
    totalRecords: number;
    generatedAt: Timestamp;
    queryTime: number;
    cached: boolean;
    nextCursor?: string;
  };
  success: boolean;
  errors?: string[];
}