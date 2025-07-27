import { Timestamp } from 'firebase/firestore';
import { DetailedCommunityMember } from '../types/member.types';
import { User } from 'firebase/auth';

type NewMemberPayload = Omit<DetailedCommunityMember, 'id' | 'createdAt' | 'updatedAt'>;

export const createDefaultMemberPayload = (
  user: User,
  communityId: string
): NewMemberPayload => {
  const now = Timestamp.now();
  return {
    communityId,
    userId: user.uid,
    role: 'member',
    status: 'active',
    isOnline: true,
    joinedAt: now,
    lastSeen: now,
    joinMethod: 'direct_join',
    createdBy: user.uid,
    permissions: [],
    userDetails: {
      id: user.uid,
      name: user.displayName || 'Anonymous',
      email: user.email || '',
      avatar: user.photoURL,
      role: 'student',
      interests: [],
      skills: [],
      joinDate: now,
      membershipDuration: 0,
      isVerified: false,
      verificationBadges: [],
      profileVisibility: 'public',
      showContactInfo: false,
      showAcademicInfo: false,
      showProfessionalInfo: false,
    },
    activityMetrics: {
      totalMessages: 0, messagesThisWeek: 0, messagesThisMonth: 0, averageMessagesPerDay: 0,
      longestMessageStreak: 0, currentMessageStreak: 0, discussionsStarted: 0, discussionParticipations: 0,
      questionsAsked: 0, questionsAnswered: 0, bestAnswers: 0, resourcesShared: 0, resourcesDownloaded: 0,
      resourcesBookmarked: 0, resourcesRated: 0, eventsCreated: 0, eventsAttended: 0, eventsMissed: 0,
      eventFeedbackGiven: 0, loginDays: 1, totalTimeSpent: 0, averageSessionDuration: 0,
      lastActiveDate: now, activeDaysStreak: 1, longestActiveStreak: 1, recentActions: [],
    },
    engagementMetrics: {
        reactionsGiven: 0, reactionsReceived: 0, mentionsGiven: 0, mentionsReceived: 0,
        repliesGiven: 0, repliesReceived: 0, helpfulVotes: 0, helpfulVotesReceived: 0, reportsMade: 0,
        reportsReceived: 0, thanksGiven: 0, thanksReceived: 0, followersCount: 0,
        followingCount: 0, referralsCount: 0, invitesSent: 0, invitesAccepted: 0,
        overallEngagementScore: 0, weeklyEngagementScore: 0, monthlyEngagementScore: 0,
        engagementTrend: 'stable', peakActivityHours: [], peakActivityDays: [],
        participationConsistency: 0, responseTime: { average: 0, fastest: 0, slowest: 0 }
    },
    gamification: {
        totalPoints: 0, availablePoints: 0, spentPoints: 0, currentLevel: 1, experiencePoints: 0, nextLevelXP: 100,
        dailyStreak: 0, weeklyStreak: 0, longestStreak: 0, currentStreakType: 'login', badges: [], achievements: [],
        completedChallenges: [], globalRank: 0, communityRank: 0, categoryRanks: [],
        levelProgress: { currentLevel: 1, currentXP: 0, requiredXP: 100, progressPercentage: 0, nextLevelRewards: [] },
        badgeProgress: [], challengeProgress: [], unclaimedRewards: [], rewardHistory: [],
        stats: { totalBadgesEarned: 0, totalAchievementsUnlocked: 0, totalChallengesCompleted: 0, averageRank: 0, bestRank: 0, pointsEarnedThisWeek: 0, pointsEarnedThisMonth: 0, levelUpsThisMonth: 0, favoriteCategory: '' }
    },
    moderation: {
        violations: [], warnings: [], restrictions: [], appeals: [], totalViolations: 0, totalWarnings: 0,
        totalRestrictions: 0, cleanRecord: true, rehabilitationProgress: 0, currentRestrictions: [],
        isMuted: false, isSuspended: false, trustLevel: 'new', reportAccuracy: 0, falseReports: 0
    },
    preferences: {
        notifications: { mentions: true, replies: true, directMessages: true, announcements: true, newMessages: true, newDiscussions: true, newResources: false, newEvents: false, newMembers: false, achievements: true, badges: true, levelUp: true, leaderboard: false, push: true, email: false, inApp: true, immediate: true, daily: false, weekly: false },
        display: { theme: 'auto', language: 'en', timezone: 'UTC', dateFormat: 'MM/dd/yyyy', timeFormat: '12h', showOnlineStatus: true, showActivity: true, showProfile: true, allowDirectMessages: true, compactMode: false, showAvatars: true, showEmoji: true, autoPlayMedia: true, soundEffects: true, animations: true, hideNSFW: true, filterProfanity: true, showPreview: true },
        privacy: { profileVisibility: 'public', activityVisibility: 'community', contactInfoVisibility: 'friends', showOnlineStatus: true, showTypingIndicator: true, allowDirectMessages: true, allowFriendRequests: true, allowMentorshipRequests: false, shareDataForAnalytics: true, shareDataForRecommendations: true },
        communication: { preferredLanguages: ['en'], communicationStyle: 'casual', responseTimeExpectation: 'flexible', availabilityHours: [], autoReplyEnabled: false, autoReplyMessage: '', mentorshipAvailable: false, collaborationOpen: false },
        content: { preferredTopics: [], blockedTopics: [], contentMaturity: 'all', languageFilter: false, showNSFWWarnings: true, autoPlayVideos: false, showImagePreviews: true, preferredContentTypes: ['text', 'image'] },
        accessibility: { highContrast: false, largeText: false, reduceMotion: false, screenReaderOptimized: false, keyboardNavigation: true, colorBlindFriendly: false, dyslexiaFriendly: false, readingSpeed: 'normal' }
    },
    // Default empty fields for remaining required properties
    customPermissions: [],
    accessLevel: 'basic',
    canInviteMembers: true,
    canCreateEvents: false,
    canShareResources: true,
    canModerate: false,
    contributionMetrics: { originalContent: 0, sharedContent: 0, curatedContent: 0, translatedContent: 0, tutorialShares: 0, codeSnippetsShared: 0, resourceRecommendations: 0, expertiseShared: [], newMembersWelcomed: 0, mentoringSessions: 0, communityEventsOrganized: 0, collaborationProjects: 0, contentQualityScore: 0, helpfulnessRating: 0, expertiseRecognition: [], communityImpactScore: 0, appreciationReceived: 0, endorsements: [], testimonials: [], awards: [] },
    social: { friends: [], following: [], followers: [], blocked: [], studyGroups: [], projectTeams: [], mentorshipRelations: [], postsShared: 0, commentsGiven: 0, likesGiven: 0, sharesGiven: 0, collaborationRequests: [], activeCollaborations: [], trustScore: 0, helpfulnessScore: 0, reliabilityScore: 0, socialInfluence: 0 },
    analytics: { analysisPeriod: { start: now, end: now }, engagementTrends: [], activityHeatmap: { hourlyActivity: [], dailyActivity: [], weeklyActivity: [] }, interactionPatterns: [], helpfulnessMetrics: { helpfulActionsGiven: 0, helpfulActionsReceived: 0, helpfulnessRatio: 0, qualityRating: 0, responseTime: 0, solutionRate: 0 }, qualityScores: [], impactMeasurement: { directImpact: 0, indirectImpact: 0, contentReach: 0, influenceScore: 0, mentorshipImpact: 0, communityContribution: 0 }, skillProgression: [], contributionGrowth: { totalContributions: { value: 0, period: '30d' }, qualityImprovement: { value: 0, period: '30d' }, diversityScore: { value: 0, period: '30d' }, consistencyScore: { value: 0, period: '30d' }, impactGrowth: { value: 0, period: '30d' } }, networkGrowth: { connectionGrowth: { value: 0, period: '30d' }, networkQuality: { value: 0, period: '30d' }, influenceGrowth: { value: 0, period: '30d' }, collaborationGrowth: { value: 0, period: '30d' }, mentorshipGrowth: { value: 0, period: '30d' } }, behaviorPatterns: [], communicationStyle: { tone: 'casual', clarity: 0, helpfulness: 0, engagement: 0, professionalism: 0, empathy: 0, knowledgeSharing: 0 }, participationStyle: { primaryRole: 'observer', activityLevel: 'low', consistency: 0, initiative: 0, collaboration: 0, leadership: 0 }, insights: [], recommendations: [] },
    metadata: { version: '1.0', lastUpdated: now, dataSource: 'client', syncStatus: 'synced', createdBy: user.uid, createdAt: now, lastModifiedBy: user.uid, lastModifiedAt: now, dataQuality: { score: 100, completeness: 100, accuracy: 100, consistency: 100, timeliness: 100, lastAssessed: now }, validationErrors: [], externalIds: [], isArchived: false, gdprConsent: true, dataRetentionPolicy: { retentionPeriod: 365, autoDeleteEnabled: false, lastReviewed: now, exceptions: [] }, privacySettings: { dataProcessingConsent: true, marketingConsent: false, analyticsConsent: true, thirdPartySharing: false, rightToForget: false, dataPortability: false }, cacheKeys: [], lastCacheUpdate: now, computedFields: [] }
  };
}; 