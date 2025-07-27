import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE GAMIFICATION INTERFACES
// ============================================================================

/**
 * Base gamification interface with common tracking fields
 */
export interface BaseGamification {
  id: string;
  userId: string;
  communityId?: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

/**
 * Gamification event types for tracking user actions
 */
export type GamificationEventType = 
  | 'message_sent'
  | 'discussion_created' 
  | 'discussion_replied'
  | 'helpful_answer'
  | 'question_resolved'
  | 'resource_shared'
  | 'resource_downloaded'
  | 'event_created'
  | 'event_attended'
  | 'member_joined'
  | 'daily_login'
  | 'weekly_active'
  | 'monthly_active'
  | 'profile_completed'
  | 'first_post'
  | 'first_help'
  | 'mentor_session'
  | 'community_created'
  | 'upvote_received'
  | 'reaction_received'
  | 'streak_maintained'
  | 'milestone_reached';

/**
 * Achievement difficulty levels
 */
export type AchievementDifficulty = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

/**
 * User roles for role-specific gamification
 */
export type UserRole = 'student' | 'alumni';

// ============================================================================
// POINTS SYSTEM
// ============================================================================

/**
 * User points tracking and management
 */
export interface UserPoints {
  userId: string;
  userRole: UserRole;
  
  // Total points
  totalPoints: number;
  lifetimePoints: number;
  
  // Points breakdown by category
  communityPoints: number;
  helpfulnessPoints: number;
  participationPoints: number;
  leadershipPoints: number;
  learningPoints: number;
  mentorshipPoints: number;
  creativePoints: number;
  socialPoints: number;
  
  // Points by time period
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  yearlyPoints: number;
  
  // Point history
  lastPointsEarned: number;
  lastPointsDate: Timestamp;
  pointsEarnedToday: number;
  
  // Multipliers and bonuses
  currentMultiplier: number;
  bonusPointsAvailable: number;
  premiumBonus: number;
  
  // Level information
  currentLevel: number;
  pointsToNextLevel: number;
  levelProgress: number; // percentage (0-100)
  
  // Metadata
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

/**
 * Point transaction history
 */
export interface PointTransaction extends BaseGamification {
  transactionType: 'earned' | 'spent' | 'bonus' | 'penalty' | 'gift';
  points: number;
  reason: string;
  eventType: GamificationEventType;
  
  // Transaction details
  sourceId?: string; // ID of the source object (message, discussion, etc.)
  sourceType?: 'message' | 'discussion' | 'resource' | 'event' | 'community';
  multiplier?: number;
  bonusApplied?: number;
  
  // Point categories affected
  categoryBreakdown: {
    community?: number;
    helpfulness?: number;
    participation?: number;
    leadership?: number;
    learning?: number;
    mentorship?: number;
    creative?: number;
    social?: number;
  };
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'reverted';
  processedAt?: Timestamp;
}

/**
 * Points configuration and rules
 */
export interface PointsConfig {
  eventType: GamificationEventType;
  basePoints: number;
  maxDailyPoints?: number;
  maxWeeklyPoints?: number;
  
  // Role-specific points
  studentPoints?: number;
  alumniPoints?: number;
  
  // Multiplier conditions
  qualityMultiplier?: number; // Based on upvotes, reactions
  timeMultiplier?: number; // Peak hours bonus
  streakMultiplier?: number; // Consecutive days bonus
  communityMultiplier?: number; // Community size bonus
  
  // Requirements
  minRequirements?: {
    messageLength?: number;
    upvotesRequired?: number;
    timeSpentMinutes?: number;
    participantsRequired?: number;
  };
  
  // Cooldown periods
  cooldownMinutes?: number;
  dailyLimit?: number;
  
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// BADGES & ACHIEVEMENTS
// ============================================================================

/**
 * Badge definition and metadata
 */
export interface Badge {
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string;
  iconColor: string;
  
  // Badge properties
  category: 'participation' | 'helpfulness' | 'leadership' | 'learning' | 'social' | 'milestone' | 'special';
  difficulty: AchievementDifficulty;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  // Requirements
  requirements: BadgeRequirement[];
  userRoleRequired?: UserRole;
  communitySpecific?: boolean;
  
  // Rewards
  pointsReward: number;
  specialRewards?: string[];
  
  // Display properties
  isVisible: boolean;
  isSecret: boolean; // Hidden until earned
  displayOrder: number;
  
  // Statistics
  totalEarnedCount: number;
  earnedThisMonth: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}

/**
 * Badge requirements and conditions
 */
export interface BadgeRequirement {
  type: 
    | 'point_threshold'
    | 'event_count' 
    | 'streak_days'
    | 'community_count'
    | 'help_count'
    | 'resource_count'
    | 'event_count'
    | 'time_period'
    | 'quality_score'
    | 'social_interaction'
    | 'special_condition';
  
  value: number;
  eventType?: GamificationEventType;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  
  // Advanced conditions
  conditions?: {
    minQualityScore?: number;
    specificCommunities?: string[];
    consecutiveDays?: boolean;
    uniqueInteractions?: boolean;
    peerEndorsements?: number;
  };
}

/**
 * User badge collection and progress
 */
export interface UserBadge extends BaseGamification {
  badgeId: string;
  earnedAt: Timestamp;
  
  // Progress tracking
  progress: BadgeProgress[];
  isCompleted: boolean;
  completionPercentage: number;
  
  // Display properties
  isDisplayed: boolean;
  displayOrder: number;
  
  // Social features
  celebrationShown: boolean;
  sharedWithCommunity: boolean;
  congratulationsReceived: number;
  
  // Context
  earnedInCommunity?: string;
  earnedForAction?: string;
  witnessedBy?: string[]; // Other users who saw the achievement
}

/**
 * Badge progress tracking
 */
export interface BadgeProgress {
  requirementIndex: number;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Timestamp;
  
  // Progress details
  recentProgress: ProgressUpdate[];
  milestones: ProgressMilestone[];
}

/**
 * Progress update for incremental tracking
 */
export interface ProgressUpdate {
  timestamp: Timestamp;
  increment: number;
  source: string;
  eventType: GamificationEventType;
}

/**
 * Progress milestones (25%, 50%, 75%, etc.)
 */
export interface ProgressMilestone {
  percentage: number;
  achievedAt: Timestamp;
  notificationSent: boolean;
}

// ============================================================================
// LEVELS & RANKINGS
// ============================================================================

/**
 * User level system
 */
export interface UserLevel {
  userId: string;
  currentLevel: number;
  currentLevelName: string;
  
  // Experience points
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpToNextLevel: number;
  levelProgress: number; // 0-100 percentage
  
  // Level history
  levelUpHistory: LevelUpEvent[];
  fastestLevelUp?: number; // days to level up
  
  // Prestige system
  prestigeLevel: number;
  prestigePoints: number;
  
  // Level benefits
  unlockedFeatures: string[];
  specialPermissions: string[];
  
  lastUpdated: Timestamp;
}

/**
 * Level up event tracking
 */
export interface LevelUpEvent {
  fromLevel: number;
  toLevel: number;
  achievedAt: Timestamp;
  xpRequired: number;
  timeTaken: number; // days
  celebrationShown: boolean;
  
  // Rewards received
  pointsRewarded: number;
  badgesUnlocked: string[];
  featuresUnlocked: string[];
}

/**
 * Level configuration
 */
export interface LevelConfig {
  level: number;
  name: string;
  xpRequired: number;
  totalXPRequired: number;
  
  // Level properties
  icon: string;
  color: string;
  description: string;
  
  // Rewards
  pointsReward: number;
  badgeRewards: string[];
  featureUnlocks: string[];
  permissionGrants: string[];
  
  // Requirements
  minActiveDays?: number;
  minCommunities?: number;
  minHelpfulActions?: number;
  
  isActive: boolean;
}

// ============================================================================
// STREAKS & CONSISTENCY
// ============================================================================

/**
 * User activity streaks
 */
export interface UserStreak {
  userId: string;
  
  // Current streaks
  currentLoginStreak: number;
  currentActivityStreak: number;
  currentHelpStreak: number;
  currentLearningStreak: number;
  
  // Best streaks (personal records)
  bestLoginStreak: number;
  bestActivityStreak: number;
  bestHelpStreak: number;
  bestLearningStreak: number;
  
  // Streak details
  loginStreakStartDate: Timestamp;
  activityStreakStartDate: Timestamp;
  helpStreakStartDate: Timestamp;
  learningStreakStartDate: Timestamp;
  
  // Last activity dates
  lastLoginDate: Timestamp;
  lastActivityDate: Timestamp;
  lastHelpDate: Timestamp;
  lastLearningDate: Timestamp;
  
  // Streak rewards earned
  streakBadgesEarned: string[];
  streakPointsEarned: number;
  streakMultiplierActive: number;
  
  // Streak protection
  freezeTokensAvailable: number;
  streaksProtected: number;
  lastFreezeUsed?: Timestamp;
  
  lastUpdated: Timestamp;
}

/**
 * Daily activity tracking for streaks
 */
export interface DailyActivity {
  userId: string;
  date: string; // YYYY-MM-DD format
  
  // Activity flags
  loggedIn: boolean;
  sentMessage: boolean;
  helpedSomeone: boolean;
  learnedSomething: boolean;
  joinedDiscussion: boolean;
  sharedResource: boolean;
  attendedEvent: boolean;
  
  // Activity counts
  messagesCount: number;
  discussionsCount: number;
  helpfulActionsCount: number;
  resourcesSharedCount: number;
  
  // Time metrics
  timeSpentMinutes: number;
  peakActivityHour: number;
  
  // Quality metrics
  qualityScore: number;
  helpfulnessRating: number;
  
  timestamp: Timestamp;
}

// ============================================================================
// LEADERBOARDS & COMPETITIONS
// ============================================================================

/**
 * Leaderboard configuration
 */
export interface Leaderboard {
  leaderboardId: string;
  name: string;
  description: string;
  
  // Leaderboard type
  type: 'global' | 'community' | 'role' | 'category' | 'temporary';
  category: 'points' | 'helpfulness' | 'participation' | 'learning' | 'mentorship' | 'creativity';
  
  // Scope
  scope: 'global' | 'community' | 'role';
  communityId?: string;
  userRole?: UserRole;
  
  // Time period
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
  startDate?: Timestamp;
  endDate?: Timestamp;
  
  // Configuration
  maxEntries: number;
  updateFrequency: 'real-time' | 'hourly' | 'daily';
  
  // Rewards
  rewards: LeaderboardReward[];
  
  // Display
  isVisible: boolean;
  displayOrder: number;
  iconUrl: string;
  
  // Statistics
  totalParticipants: number;
  lastUpdated: Timestamp;
  
  isActive: boolean;
  createdAt: Timestamp;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  leaderboardId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  avatarUrl?: string;
  
  // Position
  currentRank: number;
  previousRank: number;
  rankChange: number;
  
  // Score
  score: number;
  previousScore: number;
  scoreChange: number;
  
  // Additional metrics
  additionalMetrics: Record<string, number>;
  
  // Badges displayed
  displayBadges: string[];
  
  // Last activity
  lastActiveAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Leaderboard rewards
 */
export interface LeaderboardReward {
  rank: number; // 1 for first place, 2 for second, etc.
  rankRange?: [number, number]; // For range rewards like top 10
  
  // Rewards
  points: number;
  badges: string[];
  specialRewards: string[];
  title?: string;
  
  // Recognition
  publicRecognition: boolean;
  announcementMessage?: string;
}

// ============================================================================
// CHALLENGES & COMPETITIONS
// ============================================================================

/**
 * Challenge or competition definition
 */
export interface Challenge {
  challengeId: string;
  name: string;
  description: string;
  instructions: string;
  
  // Challenge type
  type: 'individual' | 'team' | 'community';
  category: 'learning' | 'helping' | 'creating' | 'participating' | 'social';
  difficulty: AchievementDifficulty;
  
  // Timing
  startDate: Timestamp;
  endDate: Timestamp;
  duration: number; // in days
  
  // Requirements
  requirements: ChallengeRequirement[];
  eligibility: {
    userRoles?: UserRole[];
    minLevel?: number;
    communities?: string[];
    maxParticipants?: number;
  };
  
  // Rewards
  rewards: ChallengeReward[];
  
  // Progress tracking
  totalParticipants: number;
  completedCount: number;
  
  // Display
  imageUrl: string;
  isFeature: boolean;
  tags: string[];
  
  // Status
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Timestamp;
}

/**
 * Challenge requirements
 */
export interface ChallengeRequirement {
  type: GamificationEventType;
  target: number;
  description: string;
  
  // Optional constraints
  timeframe?: 'daily' | 'weekly' | 'total';
  qualityThreshold?: number;
  specificCommunities?: string[];
  uniqueRequirement?: boolean;
}

/**
 * Challenge rewards
 */
export interface ChallengeReward {
  tier: 'completion' | 'bronze' | 'silver' | 'gold' | 'platinum';
  threshold: number; // percentage completion or rank required
  
  points: number;
  badges: string[];
  specialRewards: string[];
  title?: string;
}

/**
 * User challenge participation
 */
export interface UserChallenge extends BaseGamification {
  challengeId: string;
  
  // Participation
  joinedAt: Timestamp;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  
  // Progress
  progress: ChallengeProgress[];
  completionPercentage: number;
  currentRank?: number;
  
  // Results
  completedAt?: Timestamp;
  finalScore?: number;
  rewardsEarned: string[];
  
  // Team info (for team challenges)
  teamId?: string;
  teamRole?: 'leader' | 'member';
}

/**
 * Challenge progress tracking
 */
export interface ChallengeProgress {
  requirementIndex: number;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Timestamp;
  
  // Progress history
  progressHistory: {
    date: Timestamp;
    value: number;
    increment: number;
  }[];
}

// ============================================================================
// SOCIAL GAMIFICATION
// ============================================================================

/**
 * User achievements and social recognition
 */
export interface SocialRecognition {
  userId: string;
  
  // Peer recognition
  endorsements: UserEndorsement[];
  testimonials: UserTestimonial[];
  mentorRecommendations: MentorRecommendation[];
  
  // Social metrics
  helpfulnessVotes: number;
  thanksReceived: number;
  connectionsCount: number;
  followersCount: number;
  
  // Community reputation
  communityReputations: CommunityReputation[];
  expertiseAreas: ExpertiseArea[];
  
  // Recognition badges
  socialBadges: string[];
  peerAwardedBadges: string[];
  
  lastUpdated: Timestamp;
}

/**
 * Peer endorsement
 */
export interface UserEndorsement {
  endorserId: string;
  endorserName: string;
  skill: string;
  message: string;
  timestamp: Timestamp;
  communityId?: string;
}

/**
 * User testimonial
 */
export interface UserTestimonial {
  authorId: string;
  authorName: string;
  testimonial: string;
  context: string; // What help was provided
  rating: number; // 1-5 stars
  timestamp: Timestamp;
  communityId?: string;
  isPublic: boolean;
}

/**
 * Mentor recommendation (alumni to student)
 */
export interface MentorRecommendation {
  mentorId: string;
  mentorName: string;
  recommendation: string;
  skills: string[];
  timestamp: Timestamp;
  communityId?: string;
}

/**
 * Community-specific reputation
 */
export interface CommunityReputation {
  communityId: string;
  communityName: string;
  reputationScore: number;
  rank: number;
  totalMembers: number;
  
  // Contribution metrics
  messagesCount: number;
  helpfulAnswers: number;
  resourcesShared: number;
  eventsOrganized: number;
  
  // Recognition in community
  badges: string[];
  titles: string[];
  
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

/**
 * User expertise areas
 */
export interface ExpertiseArea {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  endorsements: number;
  demonstrationCount: number; // Times they've helped in this area
  
  // Evidence
  relatedBadges: string[];
  helpfulAnswers: number;
  resourcesShared: number;
  
  lastDemonstrated: Timestamp;
}

// ============================================================================
// NOTIFICATIONS & CELEBRATIONS
// ============================================================================

/**
 * Gamification notifications
 */
export interface GamificationNotification {
  notificationId: string;
  userId: string;
  type: 
    | 'points_earned'
    | 'badge_unlocked' 
    | 'level_up'
    | 'streak_milestone'
    | 'leaderboard_position'
    | 'challenge_available'
    | 'challenge_completed'
    | 'peer_recognition'
    | 'milestone_reached';
  
  // Content
  title: string;
  message: string;
  iconUrl?: string;
  
  // Action data
  actionData: {
    points?: number;
    badgeId?: string;
    newLevel?: number;
    streakDays?: number;
    rank?: number;
    challengeId?: string;
  };
  
  // Display properties
  priority: 'low' | 'medium' | 'high' | 'urgent';
  showCelebration: boolean;
  celebrationStyle: 'confetti' | 'fireworks' | 'badge_rain' | 'level_up';
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  isDisplayed: boolean;
  displayedAt?: Timestamp;
  
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// ============================================================================
// CONFIGURATION & SETTINGS
// ============================================================================

/**
 * Gamification system configuration
 */
export interface GamificationConfig {
  // Points system
  pointsEnabled: boolean;
  pointsConfiguration: PointsConfig[];
  
  // Badges system
  badgesEnabled: boolean;
  customBadgesAllowed: boolean;
  
  // Levels system
  levelsEnabled: boolean;
  maxLevel: number;
  prestigeEnabled: boolean;
  
  // Streaks system
  streaksEnabled: boolean;
  freezeTokensEnabled: boolean;
  maxFreezeTokens: number;
  
  // Leaderboards
  leaderboardsEnabled: boolean;
  globalLeaderboardEnabled: boolean;
  communityLeaderboardsEnabled: boolean;
  
  // Challenges
  challengesEnabled: boolean;
  userCreatedChallengesEnabled: boolean;
  
  // Social features
  socialRecognitionEnabled: boolean;
  peerEndorsementsEnabled: boolean;
  
  // Notifications
  celebrationsEnabled: boolean;
  achievementNotificationsEnabled: boolean;
  
  lastUpdated: Timestamp;
  updatedBy: string;
}

/**
 * User gamification preferences
 */
export interface UserGamificationPreferences {
  userId: string;
  
  // Feature preferences
  showPoints: boolean;
  showBadges: boolean;
  showLevel: boolean;
  showStreaks: boolean;
  showLeaderboards: boolean;
  
  // Notification preferences
  celebrationsEnabled: boolean;
  soundEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  
  // Privacy preferences
  showProfileInLeaderboards: boolean;
  allowPeerEndorsements: boolean;
  showAchievementsPublicly: boolean;
  
  // Display preferences
  preferredCelebrationStyle: 'confetti' | 'fireworks' | 'badge_rain' | 'level_up' | 'minimal';
  animationsEnabled: boolean;
  
  lastUpdated: Timestamp;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Gamification statistics summary
 */
export interface GamificationStats {
  userId: string;
  generatedAt: Timestamp;
  
  // Quick stats
  totalPoints: number;
  currentLevel: number;
  badgesCount: number;
  currentStreak: number;
  globalRank: number;
  
  // Recent achievements
  recentBadges: UserBadge[];
  recentLevelUps: LevelUpEvent[];
  recentChallengesCompleted: string[];
  
  // Milestones approaching
  nextBadgeProgress: BadgeProgress[];
  pointsToNextLevel: number;
  streakMilestones: number[];
}

/**
 * Gamification query parameters
 */
export interface GamificationQuery {
  userId?: string;
  communityId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
  startDate?: Timestamp;
  endDate?: Timestamp;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
}