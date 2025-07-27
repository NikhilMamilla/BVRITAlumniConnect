import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  FirestoreError,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  CommunityAnalytics,
  CommunityEngagement,
  UserAnalytics,
  UserEngagementTimeline,
  MessageAnalytics,
  DiscussionAnalytics,
  ResourceAnalytics,
  PerformanceAnalytics,
  LeaderboardAnalytics,
  TrendAnalytics,
  AlumniMentorshipAnalytics,
  StudentLearningAnalytics,
  AnalyticsExport,
  RealTimeAnalytics,
  AnalyticsAlert,
  AnalyticsQuery,
  AnalyticsResponse,
  AnalyticsPeriod,
  MetricType
} from '../types/analytics.types';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private readonly COMMUNITY_ANALYTICS_COLLECTION = 'communityAnalytics';

  private constructor() {}
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get community analytics (overview, engagement, trends, etc.)
   */
  async getCommunityAnalytics(communityId: string, period: AnalyticsPeriod, start: Date, end: Date): Promise<CommunityAnalytics[]> {
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('period.type', '==', period),
      where('period.start', '>=', startTimestamp),
      where('period.end', '<=', endTimestamp),
      orderBy('period.start', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as CommunityAnalytics);
  }

  /**
   * Real-time subscription to community analytics
   */
  subscribeToCommunityAnalytics(
    communityId: string,
    period: AnalyticsPeriod,
    callback: (analytics: CommunityAnalytics[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('period.type', '==', period),
      orderBy('period.start', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const analytics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as CommunityAnalytics);
      callback(analytics);
    }, onError);
  }

  /**
   * Get user analytics (activity, engagement, learning, etc.)
   */
  async getUserAnalytics(userId: string, period: AnalyticsPeriod, start: Date, end: Date): Promise<UserAnalytics[]> {
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('userId', '==', userId),
      where('period', '==', period),
      where('lastActive', '>=', startTimestamp),
      where('lastActive', '<=', endTimestamp),
      orderBy('lastActive', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as UserAnalytics);
  }

  /**
   * Real-time subscription to user analytics
   */
  subscribeToUserAnalytics(
    userId: string,
    period: AnalyticsPeriod,
    callback: (analytics: UserAnalytics[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('userId', '==', userId),
      where('period', '==', period),
      orderBy('lastActive', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const analytics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as UserAnalytics);
      callback(analytics);
    }, onError);
  }

  /**
   * Get leaderboard analytics for a community
   */
  async getLeaderboardAnalytics(communityId: string, period: AnalyticsPeriod): Promise<LeaderboardAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'leaderboard'),
      where('period', '==', period),
      orderBy('generatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as LeaderboardAnalytics);
  }

  /**
   * Get trend analytics for a community
   */
  async getTrendAnalytics(communityId: string, period: AnalyticsPeriod): Promise<TrendAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'trend'),
      where('period', '==', period),
      orderBy('analysisDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as TrendAnalytics);
  }

  /**
   * Get performance analytics (system, database, UX)
   */
  async getPerformanceAnalytics(period: AnalyticsPeriod, start: Date, end: Date): Promise<PerformanceAnalytics[]> {
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('type', '==', 'performance'),
      where('period', '==', period),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as PerformanceAnalytics);
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeAnalytics(communityId: string): Promise<RealTimeAnalytics | null> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'realtime'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as unknown as RealTimeAnalytics;
  }

  /**
   * Real-time subscription to analytics alerts
   */
  subscribeToAnalyticsAlerts(
    communityId: string,
    callback: (alerts: AnalyticsAlert[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'alert'),
      orderBy('triggeredAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as AnalyticsAlert);
      callback(alerts);
    }, onError);
  }

  /**
   * Get analytics export jobs for a user
   */
  async getAnalyticsExports(userId: string): Promise<AnalyticsExport[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('requestedBy', '==', userId),
      where('type', '==', 'export'),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as AnalyticsExport);
  }

  /**
   * Get analytics by custom query (advanced, for dashboards)
   */
  async queryAnalytics<T>(params: AnalyticsQuery): Promise<AnalyticsResponse<T>> {
    let q = query(collection(db, this.COMMUNITY_ANALYTICS_COLLECTION));
    
    if (params.communityIds && params.communityIds.length > 0) {
      q = query(q, where('communityId', 'in', params.communityIds));
    }
    if (params.userIds && params.userIds.length > 0) {
      q = query(q, where('userId', 'in', params.userIds));
    }
    if (params.period) {
      q = query(q, where('period', '==', params.period));
    }
    if (params.startDate) {
      q = query(q, where('timestamp', '>=', params.startDate));
    }
    if (params.endDate) {
      q = query(q, where('timestamp', '<=', params.endDate));
    }
    if (params.metrics && params.metrics.length > 0) {
      q = query(q, where('metric', 'in', params.metrics));
    }
    if (params.limit) {
      q = query(q, limit(params.limit));
    }
    if (params.sort) {
      q = query(q, orderBy(params.sort.field, params.sort.direction));
    }
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
    
    return {
      data,
      metadata: {
        totalRecords: data.length,
        generatedAt: Timestamp.now(),
        queryTime: 0,
        cached: false,
      },
      success: true,
    };
  }

  /**
   * Get community analytics for a specific period.
   */
  async getCommunityAnalyticsForPeriod(communityId: string, period: AnalyticsPeriod): Promise<CommunityAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('period.type', '==', period),
      orderBy('period.start', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CommunityAnalytics);
  }

  /**
   * Get historical analytics for a community over a date range.
   */
  async getCommunityAnalyticsByDateRange(communityId: string, startDate: Date, endDate: Date): Promise<CommunityAnalytics[]> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('period.start', '>=', startTimestamp),
      where('period.end', '<=', endTimestamp),
      orderBy('period.start', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CommunityAnalytics);
  }

  /**
   * Get user-specific analytics for a community.
   */
  async getUserAnalyticsForCommunity(communityId: string, userId: string, period: AnalyticsPeriod): Promise<UserAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('userId', '==', userId),
      where('period', '==', period),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserAnalytics);
  }
  
  /**
   * Get user-specific analytics for a community over a date range.
   */
  async getUserAnalyticsByDateRange(communityId: string, userId: string, startDate: Date, endDate: Date): Promise<UserAnalytics[]> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('userId', '==', userId),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserAnalytics);
  }

  /**
   * Get leaderboard data.
   */
  async getLeaderboard(communityId: string, period: AnalyticsPeriod): Promise<LeaderboardAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'leaderboard'),
      where('period', '==', period),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardAnalytics);
  }

  /**
   * Get trend analytics.
   */
  async getTrendAnalyticsForPeriod(communityId: string, period: AnalyticsPeriod): Promise<TrendAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'trend'),
      where('period', '==', period)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TrendAnalytics);
  }

  /**
   * Get performance metrics.
   */
  async getPerformanceAnalyticsForPeriod(limitCount = 100): Promise<PerformanceAnalytics[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('type', '==', 'performance'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PerformanceAnalytics);
  }

  /**
   * Get real-time analytics.
   */
  async getRealTimeAnalyticsForCommunity(communityId: string): Promise<RealTimeAnalytics | null> {
    const docSnap = await getDoc(doc(db, this.COMMUNITY_ANALYTICS_COLLECTION, communityId));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as unknown as RealTimeAnalytics;
  }

  /**
   * Subscribe to real-time alerts.
   */
  subscribeToAlerts(communityId: string, callback: (alerts: AnalyticsAlert[]) => void, onError: (error: FirestoreError) => void): Unsubscribe {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('communityId', '==', communityId),
      where('type', '==', 'alert'),
      orderBy('triggeredAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as AnalyticsAlert);
      callback(alerts);
    }, onError);
  }

  /**
   * Get analytics data exports.
   */
  async getAnalyticsExportsForUser(userId: string): Promise<AnalyticsExport[]> {
    const q = query(
      collection(db, this.COMMUNITY_ANALYTICS_COLLECTION),
      where('requestedBy', '==', userId),
      where('type', '==', 'export'),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AnalyticsExport);
  }
}

export const analyticsService = AnalyticsService.getInstance(); 