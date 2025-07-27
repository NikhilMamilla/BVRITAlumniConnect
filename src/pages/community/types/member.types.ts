// src/pages/community/types/member.types.ts

import { 
  BaseDocument, 
  UserReference, 
  FirestoreTimestamp,
  EntityStatus,
  MetricData
} from './common.types';

import {
  CommunityRole,
  MemberStatus,
  CommunityPermission,
  MemberBadge,
  MemberAchievement,
  MemberNotificationSettings,
  MemberDisplayPreferences,
  ModerationViolation
} from './community.types';

// ==================== EXTENDED MEMBER TYPES ====================
export interface DetailedCommunityMember extends BaseDocument {
  // Core Identity
  communityId: string;
  userId: string;
  userDetails: ExtendedUserReference;
  
  // Membership Information
  role: CommunityRole;
  customRole?: CustomRole;
  customTitle?: string;
  joinedAt: FirestoreTimestamp;
  invitedBy?: string;
  invitedAt?: FirestoreTimestamp;
  joinMethod: JoinMethod;
  joinReason?: string;
  approvedBy?: string;
  approvedAt?: FirestoreTimestamp;
  
  // Current Status
  status: MemberStatus;
  isOnline: boolean;
  lastSeen: FirestoreTimestamp;
  currentDevice?: DeviceInfo;
  currentLocation?: string; // Page/section in app
  
  // Permissions & Access
  permissions: CommunityPermission[];
  customPermissions: CustomPermission[];
  accessLevel: AccessLevel;
  canInviteMembers: boolean;
  canCreateEvents: boolean;
  canShareResources: boolean;
  canModerate: boolean;
  
  // Activity Metrics
  activityMetrics: MemberActivityMetrics;
  engagementMetrics: MemberEngagementMetrics;
  contributionMetrics: MemberContributionMetrics;
  
  // Gamification
  gamification: MemberGamification;
  
  // Social Features
  social: MemberSocialData;
  
  // Preferences
  preferences: CompleteMemberPreferences;
  
  // Moderation History
  moderation: MemberModerationHistory;
  
  // Analytics
  analytics: MemberAnalytics;
  
  // Metadata
  metadata: MemberMetadata;
}

// ==================== USER REFERENCE EXTENSIONS ====================
export interface ExtendedUserReference extends UserReference {
  // Additional Profile Info
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  
  // Academic Info
  currentSemester?: number;
  cgpa?: number;
  specialization?: string;
  interests: string[];
  skills: string[];
  
  // Professional Info
  currentPosition?: string;
  company?: string;
  experience?: number;
  achievements?: string[];
  
  // Community Specific
  joinDate: FirestoreTimestamp;
  membershipDuration: number; // in days
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
  
  // Privacy Settings
  profileVisibility: ProfileVisibility;
  showContactInfo: boolean;
  showAcademicInfo: boolean;
  showProfessionalInfo: boolean;
}

export interface VerificationBadge {
  type: VerificationType;
  verifiedAt: FirestoreTimestamp;
  verifiedBy: string;
  expiresAt?: FirestoreTimestamp;
}

export type VerificationType = 
  | 'email' | 'phone' | 'student_id' | 'alumni_status'
  | 'linkedin' | 'github' | 'domain_expert' | 'mentor';

export type ProfileVisibility = 'public' | 'members_only' | 'friends_only' | 'private';

// ==================== MEMBER ROLES & PERMISSIONS ====================
export interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon?: string;
  hierarchy: number; // Higher number = higher authority
  isDefault: boolean;
  permissions: string[];
  createdBy: string;
  createdAt: FirestoreTimestamp;
}

export interface CustomPermission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  grantedBy: string;
  grantedAt: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  conditions?: PermissionCondition[];
}

export type PermissionCategory = 
  | 'content' | 'moderation' | 'management' | 'events'
  | 'resources' | 'analytics' | 'members' | 'settings';

export interface PermissionCondition {
  type: ConditionType;
  value: unknown;
  operator: '==' | '!=' | '>' | '<' | 'in' | 'contains';
}

export type ConditionType = 
  | 'time_based' | 'activity_based' | 'role_based' 
  | 'tenure_based' | 'contribution_based';

export type AccessLevel = 'basic' | 'standard' | 'premium' | 'admin' | 'owner';

export type JoinMethod = 
  | 'direct_join' | 'invitation' | 'application' 
  | 'referral' | 'admin_added' | 'bulk_import';

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser?: string;
  version?: string;
  userAgent?: string;
}

// ==================== ACTIVITY METRICS ====================
export interface MemberActivityMetrics {
  // Message Activity
  totalMessages: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageMessagesPerDay: number;
  longestMessageStreak: number;
  currentMessageStreak: number;
  
  // Discussion Activity
  discussionsStarted: number;
  discussionParticipations: number;
  questionsAsked: number;
  questionsAnswered: number;
  bestAnswers: number;
  
  // Resource Activity
  resourcesShared: number;
  resourcesDownloaded: number;
  resourcesBookmarked: number;
  resourcesRated: number;
  
  // Event Activity
  eventsCreated: number;
  eventsAttended: number;
  eventsMissed: number;
  eventFeedbackGiven: number;
  
  // General Activity
  loginDays: number;
  totalTimeSpent: number; // in minutes
  averageSessionDuration: number;
  lastActiveDate: FirestoreTimestamp;
  activeDaysStreak: number;
  longestActiveStreak: number;
  
  // Recent Activity
  recentActions: RecentMemberAction[];
}

export interface RecentMemberAction {
  type: MemberActionType;
  description: string;
  timestamp: FirestoreTimestamp;
  relatedId?: string;
  relatedType?: string;
  impact?: number; // Points or score impact
}

export type MemberActionType = 
  | 'message_sent' | 'discussion_created' | 'discussion_replied'
  | 'resource_shared' | 'event_created' | 'event_attended'
  | 'member_helped' | 'poll_created' | 'poll_voted'
  | 'achievement_unlocked' | 'badge_earned' | 'level_up';

// ==================== ENGAGEMENT METRICS ====================
export interface MemberEngagementMetrics {
  // Interaction Metrics
  reactionsGiven: number;
  reactionsReceived: number;
  mentionsGiven: number;
  mentionsReceived: number;
  repliesGiven: number;
  repliesReceived: number;
  
  // Quality Metrics
  helpfulVotes: number;
  helpfulVotesReceived: number;
  reportsMade: number;
  reportsReceived: number;
  thanksGiven: number;
  thanksReceived: number;
  
  // Influence Metrics
  followersCount: number;
  followingCount: number;
  referralsCount: number;
  invitesSent: number;
  invitesAccepted: number;
  
  // Engagement Score
  overallEngagementScore: number;
  weeklyEngagementScore: number;
  monthlyEngagementScore: number;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Participation Patterns
  peakActivityHours: number[];
  peakActivityDays: number[];
  participationConsistency: number;
  responseTime: {
    average: number;
    fastest: number;
    slowest: number;
  };
}

// ==================== CONTRIBUTION METRICS ====================
export interface MemberContributionMetrics {
  // Content Contributions
  originalContent: number;
  sharedContent: number;
  curatedContent: number;
  translatedContent: number;
  
  // Knowledge Sharing
  tutorialShares: number;
  codeSnippetsShared: number;
  resourceRecommendations: number;
  expertiseShared: string[];
  
  // Community Building
  newMembersWelcomed: number;
  mentoringSessions: number;
  communityEventsOrganized: number;
  collaborationProjects: number;
  
  // Quality Indicators
  contentQualityScore: number;
  helpfulnessRating: number;
  expertiseRecognition: ExpertiseArea[];
  communityImpactScore: number;
  
  // Recognition
  appreciationReceived: number;
  endorsements: Endorsement[];
  testimonials: Testimonial[];
  awards: CommunityAward[];
}

export interface ExpertiseArea {
  skill: string;
  level: ExpertiseLevel;
  endorsements: number;
  lastDemonstrated: FirestoreTimestamp;
  evidence: string[]; // Links to posts, resources, etc.
}

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface Endorsement {
  skill: string;
  endorsedBy: string;
  endorserName: string;
  message?: string;
  endorsedAt: FirestoreTimestamp;
  weight: number; // Based on endorser's credibility
}

export interface Testimonial {
  fromUserId: string;
  fromUserName: string;
  message: string;
  category: TestimonialCategory;
  rating: number;
  givenAt: FirestoreTimestamp;
  isPublic: boolean;
}

export type TestimonialCategory = 
  | 'helpfulness' | 'expertise' | 'mentorship' 
  | 'collaboration' | 'leadership' | 'communication';

export interface CommunityAward {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AwardCategory;
  receivedAt: FirestoreTimestamp;
  presentedBy: string;
  significance: AwardSignificance;
}

export type AwardCategory = 
  | 'contributor' | 'helper' | 'innovator' | 'leader'
  | 'mentor' | 'collaborator' | 'supporter' | 'creator';

export type AwardSignificance = 'bronze' | 'silver' | 'gold' | 'platinum';

// ==================== GAMIFICATION SYSTEM ====================
export interface MemberGamification {
  // Core Stats
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  currentLevel: number;
  experiencePoints: number;
  nextLevelXP: number;
  
  // Streaks
  dailyStreak: number;
  weeklyStreak: number;
  longestStreak: number;
  currentStreakType: StreakType;
  
  // Badges & Achievements
  badges: DetailedMemberBadge[];
  achievements: DetailedMemberAchievement[];
  completedChallenges: CompletedChallenge[];
  
  // Leaderboard Position
  globalRank: number;
  communityRank: number;
  categoryRanks: CategoryRank[];
  
  // Progress Tracking
  levelProgress: LevelProgress;
  badgeProgress: BadgeProgress[];
  challengeProgress: ChallengeProgress[];
  
  // Rewards
  unclaimedRewards: UnclaimedReward[];
  rewardHistory: RewardHistory[];
  
  // Statistics
  stats: GamificationStats;
}

export type StreakType = 'login' | 'message' | 'help' | 'contribute' | 'learn';

export interface DetailedMemberBadge extends MemberBadge {
  category: BadgeCategory;
  requirements: BadgeRequirement[];
  tier: BadgeTier;
  isRare: boolean;
  holders: number;
  nextTier?: string;
}

export type BadgeCategory = 
  | 'participation' | 'contribution' | 'social' | 'achievement'
  | 'skill' | 'milestone' | 'special' | 'seasonal';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface BadgeRequirement {
  type: RequirementType;
  description: string;
  target: number;
  current: number;
  unit: string;
}

export type RequirementType = 
  | 'messages_count' | 'days_active' | 'helps_given'
  | 'resources_shared' | 'events_attended' | 'votes_received'
  | 'streak_maintained' | 'level_reached' | 'special_action';

export interface DetailedMemberAchievement extends MemberAchievement {
  difficulty: AchievementDifficulty;
  completionRate: number; // Percentage of community who has this
  prerequisites: string[]; // Achievement IDs required first
  rewards: AchievementReward[];
  celebrationShown: boolean;
}

export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface AchievementReward {
  type: RewardType;
  amount: number;
  description: string;
  claimed: boolean;
}

export type RewardType = 'points' | 'badge' | 'title' | 'privilege' | 'item';

export interface CompletedChallenge {
  id: string;
  name: string;
  description: string;
  completedAt: FirestoreTimestamp;
  points: number;
  rank: number;
  totalParticipants: number;
  rewards: AchievementReward[];
}

export interface CategoryRank {
  category: string;
  rank: number;
  score: number;
  totalParticipants: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  progressPercentage: number;
  nextLevelRewards: AchievementReward[];
  recentLevelUp?: FirestoreTimestamp;
}

export interface BadgeProgress {
  badgeId: string;
  badgeName: string;
  currentProgress: number;
  requiredProgress: number;
  progressPercentage: number;
  estimatedCompletion?: FirestoreTimestamp;
}

export interface ChallengeProgress {
  challengeId: string;
  challengeName: string;
  startedAt: FirestoreTimestamp;
  endsAt?: FirestoreTimestamp;
  currentProgress: number;
  requiredProgress: number;
  participants: number;
  currentRank: number;
}

export interface UnclaimedReward {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  amount: number;
  earnedAt: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  source: string; // What earned this reward
}

export interface RewardHistory {
  id: string;
  type: RewardType;
  name: string;
  amount: number;
  claimedAt: FirestoreTimestamp;
  source: string;
}

export interface GamificationStats {
  totalBadgesEarned: number;
  totalAchievementsUnlocked: number;
  totalChallengesCompleted: number;
  averageRank: number;
  bestRank: number;
  pointsEarnedThisWeek: number;
  pointsEarnedThisMonth: number;
  levelUpsThisMonth: number;
  favoriteCategory: string;
}

// ==================== SOCIAL FEATURES ====================
export interface MemberSocialData {
  // Connections
  friends: MemberConnection[];
  following: MemberConnection[];
  followers: MemberConnection[];
  blocked: MemberConnection[];
  
  // Groups & Networks
  studyGroups: string[];
  projectTeams: string[];
  mentorshipRelations: MentorshipRelation[];
  
  // Social Activity
  postsShared: number;
  commentsGiven: number;
  likesGiven: number;
  sharesGiven: number;
  
  // Collaboration
  collaborationRequests: CollaborationRequest[];
  activeCollaborations: ActiveCollaboration[];
  
  // Reputation
  trustScore: number;
  helpfulnessScore: number;
  reliabilityScore: number;
  socialInfluence: number;
}

export interface MemberConnection {
  userId: string;
  userName: string;
  userAvatar?: string;
  connectionType: ConnectionType;
  connectedAt: FirestoreTimestamp;
  mutualConnections: number;
  lastInteraction?: FirestoreTimestamp;
  isClose: boolean;
  tags: string[];
}

export type ConnectionType = 
  | 'friend' | 'follow' | 'mutual_follow' | 'study_buddy'
  | 'project_partner' | 'mentor' | 'mentee' | 'colleague';

export interface MentorshipRelation {
  relatedUserId: string;
  relatedUserName: string;
  type: 'mentor' | 'mentee';
  skills: string[];
  startedAt: FirestoreTimestamp;
  status: 'active' | 'completed' | 'paused';
  sessionsCount: number;
  rating?: number;
  feedback?: string;
}

export interface CollaborationRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  projectType: string;
  description: string;
  skillsNeeded: string[];
  timeCommitment: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: FirestoreTimestamp;
  respondedAt?: FirestoreTimestamp;
}

export interface ActiveCollaboration {
  id: string;
  projectName: string;
  collaborators: string[];
  role: string;
  startedAt: FirestoreTimestamp;
  expectedEnd?: FirestoreTimestamp;
  progress: number;
  status: 'planning' | 'active' | 'review' | 'completed' | 'paused';
}

// ==================== COMPLETE PREFERENCES ====================
export interface CompleteMemberPreferences {
  // Inherited from base types
  notifications: MemberNotificationSettings;
  display: MemberDisplayPreferences;
  
  // Additional preferences
  privacy: PrivacyPreferences;
  communication: CommunicationPreferences;
  content: ContentPreferences;
  accessibility: AccessibilityPreferences;
}

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibility;
  activityVisibility: ActivityVisibility;
  contactInfoVisibility: ContactVisibility;
  showOnlineStatus: boolean;
  showTypingIndicator: boolean;
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
  allowMentorshipRequests: boolean;
  shareDataForAnalytics: boolean;
  shareDataForRecommendations: boolean;
}

export type ActivityVisibility = 'public' | 'friends' | 'community' | 'private';
export type ContactVisibility = 'public' | 'verified_only' | 'friends' | 'hidden';

export interface CommunicationPreferences {
  preferredLanguages: string[];
  communicationStyle: CommunicationStyle;
  responseTimeExpectation: ResponseTime;
  availabilityHours: AvailabilityWindow[];
  autoReplyEnabled: boolean;
  autoReplyMessage?: string;
  mentorshipAvailable: boolean;
  collaborationOpen: boolean;
}

export type CommunicationStyle = 'formal' | 'casual' | 'mixed' | 'professional';
export type ResponseTime = 'immediate' | 'within_hour' | 'within_day' | 'flexible';

export interface AvailabilityWindow {
  day: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ContentPreferences {
  preferredTopics: string[];
  blockedTopics: string[];
  contentMaturity: ContentMaturity;
  languageFilter: boolean;
  showNSFWWarnings: boolean;
  autoPlayVideos: boolean;
  showImagePreviews: boolean;
  preferredContentTypes: ContentType[];
}

export type ContentMaturity = 'all' | 'teen' | 'mature' | 'restricted';
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'link';

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  colorBlindFriendly: boolean;
  dyslexiaFriendly: boolean;
  readingSpeed: ReadingSpeed;
}

export type ReadingSpeed = 'slow' | 'normal' | 'fast';

// ==================== MODERATION HISTORY ====================
export interface MemberModerationHistory {
  violations: ModerationViolation[];
  warnings: ModerationWarning[];
  restrictions: ModerationRestriction[];
  appeals: ModerationAppeal[];
  
  // Summary Stats
  totalViolations: number;
  totalWarnings: number;
  totalRestrictions: number;
  cleanRecord: boolean;
  lastViolation?: FirestoreTimestamp;
  rehabilitationProgress: number;
  
  // Current Status
  currentRestrictions: ActiveRestriction[];
  isMuted: boolean;
  muteExpires?: FirestoreTimestamp;
  isSuspended: boolean;
  suspensionExpires?: FirestoreTimestamp;
  
  // Trust Metrics
  trustLevel: TrustLevel;
  reportAccuracy: number; // How often their reports are valid
  falseReports: number;
}

export interface ModerationWarning {
  id: string;
  reason: string;
  description: string;
  issuedBy: string;
  issuedAt: FirestoreTimestamp;
  severity: WarningSeverity;
  acknowledged: boolean;
  acknowledgedAt?: FirestoreTimestamp;
  relatedViolation?: string;
}

export type WarningSeverity = 'minor' | 'moderate' | 'serious' | 'final';

export interface ModerationRestriction {
  id: string;
  type: RestrictionType;
  reason: string;
  appliedBy: string;
  appliedAt: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  status: RestrictionStatus;
  conditions?: string[];
}

export type RestrictionType = 
  | 'message_limit' | 'post_restriction' | 'resource_ban'
  | 'event_ban' | 'invite_ban' | 'feature_restriction';

export type RestrictionStatus = 'active' | 'expired' | 'lifted' | 'appealed' | 'modified';

export interface ModerationAppeal {
  id: string;
  violationId: string;
  reason: string;
  evidence?: string[];
  submittedAt: FirestoreTimestamp;
  status: AppealStatus;
  reviewedBy?: string;
  reviewedAt?: FirestoreTimestamp;
  decision?: string;
  decisionReason?: string;
}

export type AppealStatus = 'pending' | 'under_review' | 'approved' | 'denied' | 'withdrawn';

export interface ActiveRestriction {
  type: RestrictionType;
  description: string;
  expiresAt?: FirestoreTimestamp;
  canAppeal: boolean;
}

export type TrustLevel = 'untrusted' | 'new' | 'basic' | 'trusted' | 'veteran' | 'moderator';

// ==================== ANALYTICS ====================
export interface MemberAnalytics {
  // Engagement Analytics
  engagementTrends: EngagementTrend[];
  activityHeatmap: ActivityHeatmap;
  interactionPatterns: InteractionPattern[];
  
  // Performance Metrics
  helpfulnessMetrics: HelpfulnessMetrics;
  qualityScores: QualityScore[];
  impactMeasurement: ImpactMeasurement;
  
  // Growth Tracking
  skillProgression: SkillProgression[];
  contributionGrowth: ContributionGrowth;
  networkGrowth: NetworkGrowth;
  
  // Behavioral Analysis
  behaviorPatterns: BehaviorPattern[];
  communicationStyle: CommunicationAnalysis;
  participationStyle: ParticipationStyle;
  
  // Insights & Recommendations
  insights: MemberInsight[];
  recommendations: MemberRecommendation[];
  
  // Period
  analysisPeriod: {
    start: FirestoreTimestamp;
    end: FirestoreTimestamp;
  };
}

export interface EngagementTrend {
  date: FirestoreTimestamp;
  messagesCount: number;
  reactionsCount: number;
  helpfulActions: number;
  timeSpent: number;
  engagementScore: number;
}

export interface ActivityHeatmap {
  hourlyActivity: number[]; // 24 hours
  dailyActivity: number[];  // 7 days
  weeklyActivity: number[]; // 52 weeks
}

export interface InteractionPattern {
  type: InteractionType;
  frequency: number;
  averageQuality: number;
  preferredTimes: string[];
  commonTargets: string[];
}

export type InteractionType = 'message' | 'reply' | 'reaction' | 'help' | 'share' | 'collaborate';

export interface HelpfulnessMetrics {
  helpfulActionsGiven: number;
  helpfulActionsReceived: number;
  helpfulnessRatio: number;
  qualityRating: number;
  responseTime: number;
  solutionRate: number;
}

export interface QualityScore {
  category: QualityCategory;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  benchmarkComparison: number;
  lastUpdated: FirestoreTimestamp;
}

export type QualityCategory = 
  | 'content_quality' | 'helpfulness' | 'communication'
  | 'collaboration' | 'leadership' | 'expertise';

export interface ImpactMeasurement {
  directImpact: number; // People directly helped
  indirectImpact: number; // Estimated broader impact
  contentReach: number; // Views of shared content
  influenceScore: number;
  mentorshipImpact: number;
  communityContribution: number;
}

export interface SkillProgression {
  skill: string;
  startLevel: ExpertiseLevel;
  currentLevel: ExpertiseLevel;
  progressRate: number;
  milestones: SkillMilestone[];
  endorsementGrowth: number;
  practicalApplications: number;
}

export interface SkillMilestone {
  level: ExpertiseLevel;
  achievedAt: FirestoreTimestamp;
  evidence: string[];
  recognizedBy: string[];
}

export interface ContributionGrowth {
  totalContributions: MetricData;
  qualityImprovement: MetricData;
  diversityScore: MetricData;
  consistencyScore: MetricData;
  impactGrowth: MetricData;
}

export interface NetworkGrowth {
  connectionGrowth: MetricData;
  networkQuality: MetricData;
  influenceGrowth: MetricData;
  collaborationGrowth: MetricData;
  mentorshipGrowth: MetricData;
}

export interface BehaviorPattern {
  pattern: PatternType;
  frequency: number;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
}

export type PatternType = 
  | 'regular_contributor' | 'help_seeker' | 'knowledge_sharer'
  | 'social_connector' | 'event_organizer' | 'lurker'
  | 'perfectionist' | 'quick_responder' | 'deep_thinker';

export interface CommunicationAnalysis {
  tone: CommunicationTone;
  clarity: number;
  helpfulness: number;
  engagement: number;
  professionalism: number;
  empathy: number;
  knowledgeSharing: number;
}

export type CommunicationTone = 'supportive' | 'informative' | 'casual' | 'formal' | 'encouraging';

export interface ParticipationStyle {
  primaryRole: ParticipationRole;
  activityLevel: ActivityIntensity;
  consistency: number;
  initiative: number;
  collaboration: number;
  leadership: number;
}

export type ParticipationRole = 'contributor' | 'helper' | 'learner' | 'connector' | 'leader' | 'observer';
export type ActivityIntensity = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface MemberInsight {
  type: InsightType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  category: InsightCategory;
  confidence: number;
  generatedAt: FirestoreTimestamp;
}

export type InsightType = 
  | 'engagement_opportunity' | 'skill_development' | 'network_expansion'
  | 'contribution_potential' | 'leadership_opportunity' | 'collaboration_match';

export type InsightCategory = 'growth' | 'engagement' | 'skills' | 'social' | 'performance';

// Continuing from MemberRecommendation interface...

export interface MemberRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'minimal' | 'moderate' | 'significant';
  expectedImpact: 'low' | 'medium' | 'high';
  actionItems: string[];
  relatedUsers?: string[];
  relatedCommunities?: string[];
  deadline?: FirestoreTimestamp;
  status: 'pending' | 'viewed' | 'acted_on' | 'dismissed';
  generatedAt: FirestoreTimestamp;
  validUntil?: FirestoreTimestamp;
}

export type RecommendationType = 
  | 'join_community' | 'start_discussion' | 'share_knowledge'
  | 'connect_with_member' | 'attend_event' | 'complete_profile'
  | 'mentor_someone' | 'seek_mentor' | 'collaborate_project'
  | 'contribute_resource' | 'improve_skill' | 'engage_more';

// ==================== METADATA ====================
export interface MemberMetadata {
  // Technical Metadata
  version: string;
  lastUpdated: FirestoreTimestamp;
  dataSource: string;
  syncStatus: SyncStatus;
  
  // Audit Trail
  createdBy: string;
  createdAt: FirestoreTimestamp;
  lastModifiedBy: string;
  lastModifiedAt: FirestoreTimestamp;
  
  // Data Quality
  dataQuality: DataQuality;
  validationErrors: ValidationError[];
  
  // Integration
  externalIds: ExternalId[];
  importSource?: string;
  importedAt?: FirestoreTimestamp;
  
  // Archival
  isArchived: boolean;
  archivedAt?: FirestoreTimestamp;
  archivedBy?: string;
  archivedReason?: string;
  
  // Compliance
  gdprConsent: boolean;
  dataRetentionPolicy: DataRetentionPolicy;
  privacySettings: PrivacySettings;
  
  // Performance
  cacheKeys: string[];
  lastCacheUpdate: FirestoreTimestamp;
  computedFields: ComputedField[];
}

export type SyncStatus = 'synced' | 'pending' | 'failed' | 'partial';

export interface DataQuality {
  score: number; // 0-100
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  lastAssessed: FirestoreTimestamp;
}

export interface ValidationError {
  field: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  detectedAt: FirestoreTimestamp;
  resolved: boolean;
  resolvedAt?: FirestoreTimestamp;
}

export interface ExternalId {
  system: string;
  id: string;
  type: string;
  verifiedAt?: FirestoreTimestamp;
}

export interface DataRetentionPolicy {
  retentionPeriod: number; // in days
  autoDeleteEnabled: boolean;
  lastReviewed: FirestoreTimestamp;
  exceptions: string[];
}

export interface PrivacySettings {
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  thirdPartySharing: boolean;
  rightToForget: boolean;
  dataPortability: boolean;
}

export interface ComputedField {
  fieldName: string;
  value: unknown;
  computedAt: FirestoreTimestamp;
  dependsOn: string[];
  expiresAt?: FirestoreTimestamp;
}

// ==================== UTILITY TYPES ====================

// Search and Filter Types
export interface MemberSearchFilters {
  // Basic Filters
  roles?: CommunityRole[];
  statuses?: MemberStatus[];
  joinedDateRange?: DateRange;
  lastSeenRange?: DateRange;
  
  // Activity Filters
  minMessages?: number;
  maxMessages?: number;
  minEngagementScore?: number;
  maxEngagementScore?: number;
  
  // Skill Filters
  skills?: string[];
  expertise?: ExpertiseLevel[];
  interests?: string[];
  
  // Location Filters
  location?: string;
  timezone?: string;
  
  // Gamification Filters
  minLevel?: number;
  maxLevel?: number;
  badges?: string[];
  achievements?: string[];
  
  // Social Filters
  hasMentees?: boolean;
  hasMentors?: boolean;
  isOnline?: boolean;
  
  // Text Search
  searchQuery?: string;
  searchFields?: MemberSearchField[];
}

export interface DateRange {
  start: FirestoreTimestamp;
  end: FirestoreTimestamp;
}

export type MemberSearchField = 
  | 'displayName' | 'bio' | 'skills' | 'interests'
  | 'company' | 'position' | 'location' | 'customTitle';

// Sort Options
export interface MemberSortOptions {
  field: MemberSortField;
  direction: 'asc' | 'desc';
}

export type MemberSortField = 
  | 'joinedAt' | 'lastSeen' | 'displayName' | 'totalMessages'
  | 'engagementScore' | 'currentLevel' | 'totalPoints'
  | 'helpfulnessScore' | 'trustScore' | 'lastActiveDate';

// Pagination
export interface MemberPagination {
  limit: number;
  offset?: number;
  cursor?: string;
  hasMore: boolean;
}

// Bulk Operations
export interface BulkMemberOperation {
  memberIds: string[];
  operation: BulkOperationType;
  parameters?: Record<string, unknown>;
  performedBy: string;
  performedAt: FirestoreTimestamp;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: BulkOperationResult[];
}

export type BulkOperationType = 
  | 'update_role' | 'add_permission' | 'remove_permission'
  | 'send_notification' | 'add_badge' | 'export_data'
  | 'archive_members' | 'activate_members';

export interface BulkOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
  total: number;
}

// ==================== EVENT TYPES ====================

// Member Events for real-time updates
export interface MemberEvent {
  type: MemberEventType;
  memberId: string;
  communityId: string;
  data: unknown;
  timestamp: FirestoreTimestamp;
  triggeredBy?: string;
}

export type MemberEventType = 
  | 'member_joined' | 'member_left' | 'member_updated'
  | 'role_changed' | 'status_changed' | 'online_status_changed'
  | 'achievement_unlocked' | 'badge_earned' | 'level_up'
  | 'message_sent' | 'reaction_added' | 'help_provided'
  | 'connection_made' | 'collaboration_started'
  | 'violation_reported' | 'warning_issued' | 'restriction_applied';

// ==================== API RESPONSE TYPES ====================

// API Response wrappers
export interface MemberResponse {
  member: DetailedCommunityMember;
  includePrivateData: boolean;
  requestedBy: string;
  timestamp: FirestoreTimestamp;
}

export interface MemberListResponse {
  members: DetailedCommunityMember[];
  pagination: MemberPagination;
  filters: MemberSearchFilters;
  sortOptions: MemberSortOptions;
  totalCount: number;
  timestamp: FirestoreTimestamp;
}

export interface MemberStatsResponse {
  totalMembers: number;
  activeMembers: number;
  onlineMembers: number;
  newThisWeek: number;
  newThisMonth: number;
  topContributors: MemberSummary[];
  engagementStats: EngagementStats;
  timestamp: FirestoreTimestamp;
}

export interface MemberSummary {
  id: string;
  displayName: string;
  avatar?: string;
  role: CommunityRole;
  joinedAt: FirestoreTimestamp;
  isOnline: boolean;
  totalMessages: number;
  engagementScore: number;
  currentLevel: number;
  trustScore: number;
}

export interface EngagementStats {
  averageMessagesPerDay: number;
  averageSessionDuration: number;
  mostActiveHours: number[];
  mostActiveDays: number[];
  retentionRate: number;
  churnRate: number;
}

// ==================== CONFIGURATION TYPES ====================

// Community-specific member configurations
export interface CommunityMemberConfig {
  communityId: string;
  
  // Joining Settings
  requireApproval: boolean;
  maxMembers?: number;
  allowedJoinMethods: JoinMethod[];
  
  // Role Settings
  defaultRole: CommunityRole;
  availableRoles: CommunityRole[];
  customRoles: CustomRole[];
  
  // Permission Settings
  defaultPermissions: CommunityPermission[];
  rolePermissions: Record<string, CommunityPermission[]>;
  
  // Gamification Settings
  gamificationEnabled: boolean;
  pointsSystem: PointsSystem;
  badgeSystem: BadgeSystem;
  
  // Moderation Settings
  moderationEnabled: boolean;
  autoModerationRules: AutoModerationRule[];
  
  // Analytics Settings
  analyticsEnabled: boolean;
  trackingEnabled: boolean;
  retentionPeriod: number;
}

export interface PointsSystem {
  enabled: boolean;
  pointsPerMessage: number;
  pointsPerReaction: number;
  pointsPerHelpfulAnswer: number;
  pointsPerResourceShare: number;
  pointsPerEventAttendance: number;
  levelUpThresholds: number[];
}

export interface BadgeSystem {
  enabled: boolean;
  availableBadges: string[];
  customBadges: CustomBadge[];
  autoAwardRules: BadgeAwardRule[];
}

export interface CustomBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: BadgeRequirement[];
  isActive: boolean;
}

export interface BadgeAwardRule {
  badgeId: string;
  triggerType: BadgeTriggerType;
  conditions: BadgeCondition[];
  autoAward: boolean;
}

export type BadgeTriggerType = 
  | 'message_count' | 'helpful_answers' | 'days_active'
  | 'resources_shared' | 'events_attended' | 'level_reached';

export interface BadgeCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: unknown;
}

export interface AutoModerationRule {
  id: string;
  name: string;
  description: string;
  triggerType: ModerationTriggerType;
  conditions: ModerationCondition[];
  actions: ModerationAction[];
  isActive: boolean;
}

export type ModerationTriggerType = 
  | 'message_content' | 'spam_detection' | 'harassment'
  | 'inappropriate_content' | 'excessive_posting' | 'rule_violation';

export interface ModerationCondition {
  type: string;
  value: unknown;
  threshold?: number;
}

export interface ModerationAction {
  type: ModerationActionType;
  parameters?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type ModerationActionType = 
  | 'warn_user' | 'delete_message' | 'mute_user'
  | 'restrict_user' | 'flag_for_review' | 'notify_moderators';

// ==================== CONSTANTS ====================

// Default values and constants
export const DEFAULT_MEMBER_PERMISSIONS: string[] = [
  'read_messages',
  'send_messages',
  'react_to_messages',
  'view_members'
];

export const DEFAULT_GAMIFICATION_CONFIG: PointsSystem = {
  enabled: true,
  pointsPerMessage: 1,
  pointsPerReaction: 0.5,
  pointsPerHelpfulAnswer: 10,
  pointsPerResourceShare: 5,
  pointsPerEventAttendance: 15,
  levelUpThresholds: [0, 100, 250, 500, 1000, 2000, 5000, 10000]
};

export const MEMBER_ACTIVITY_THRESHOLDS = {
  VERY_LOW: 0,
  LOW: 5,
  MODERATE: 20,
  HIGH: 50,
  VERY_HIGH: 100
} as const;

export const TRUST_LEVEL_THRESHOLDS = {
  UNTRUSTED: 0,
  NEW: 10,
  BASIC: 25,
  TRUSTED: 50,
  VETERAN: 100,
  MODERATOR: 200
} as const;