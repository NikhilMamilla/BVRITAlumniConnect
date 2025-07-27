// useCommunityAnalytics.ts
// Placeholder for useCommunityAnalytics hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  CommunityAnalytics,
  UserAnalytics,
  LeaderboardAnalytics,
  TrendAnalytics,
  PerformanceAnalytics,
  RealTimeAnalytics,
  AnalyticsAlert,
  AnalyticsExport,
  AnalyticsQuery,
  AnalyticsResponse,
  AnalyticsPeriod
} from '../types/analytics.types';
import { analyticsService } from '../services/analyticsService';
import type { FirestoreError } from 'firebase/firestore';

/**
 * useCommunityAnalytics - Real-time, advanced hook for community/user analytics.
 * @param params - Analytics parameters (communityId, userId, period, etc.).
 * @returns Analytics state, real-time analytics, and analytics actions.
 */
export function useCommunityAnalytics(
  params: {
    communityId?: string;
    userId?: string;
    period?: AnalyticsPeriod;
    start?: Date;
    end?: Date;
  }
) {
  // Community Analytics
  const [communityAnalytics, setCommunityAnalytics] = useState<CommunityAnalytics[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState<Error | null>(null);
  const communityUnsubRef = useRef<(() => void) | null>(null);

  // User Analytics
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const userUnsubRef = useRef<(() => void) | null>(null);

  // Real-time Analytics Alerts
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<Error | null>(null);
  const alertsUnsubRef = useRef<(() => void) | null>(null);

  // Real-time subscription to community analytics
  useEffect(() => {
    if (!params.communityId || !params.period) return;
    setCommunityLoading(true);
    setCommunityError(null);
    communityUnsubRef.current?.();
    communityUnsubRef.current = analyticsService.subscribeToCommunityAnalytics(
      params.communityId,
      params.period,
      (analytics) => {
        setCommunityAnalytics(analytics);
        setCommunityLoading(false);
      },
      (err) => {
        console.error('Error fetching community analytics:', err);
        setCommunityError(err instanceof Error ? err : new Error('Unknown error'));
        setCommunityLoading(false);
      }
    );
    return () => {
      communityUnsubRef.current?.();
    };
  }, [params.communityId, params.period]);

  // Real-time subscription to user analytics
  useEffect(() => {
    if (!params.userId || !params.period) return;
    setUserLoading(true);
    setUserError(null);
    userUnsubRef.current?.();
    userUnsubRef.current = analyticsService.subscribeToUserAnalytics(
      params.userId,
      params.period,
      (analytics) => {
        setUserAnalytics(analytics);
        setUserLoading(false);
      },
      (err) => {
        console.error('Error fetching user analytics:', err);
        setUserError(err instanceof Error ? err : new Error('Unknown error'));
        setUserLoading(false);
      }
    );
    return () => {
      userUnsubRef.current?.();
    };
  }, [params.userId, params.period]);

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!params.communityId) return;
    setAlertsLoading(true);
    setAlertsError(null);
    alertsUnsubRef.current?.();
    alertsUnsubRef.current = analyticsService.subscribeToAnalyticsAlerts(
      params.communityId,
      (alertsData) => {
        setAlerts(alertsData);
        setAlertsError(null);
        setAlertsLoading(false);
      },
      (err) => {
        setAlertsError(err instanceof Error ? err : new Error('Unknown error'));
        setAlertsLoading(false);
      }
    );

    return () => {
      alertsUnsubRef.current?.();
    };
  }, [params.communityId]);

  // Fetch community analytics (one-time, not real-time)
  const fetchCommunityAnalytics = useCallback(async () => {
    if (!params.communityId || !params.period || !params.start || !params.end) return [];
    setCommunityLoading(true);
    setCommunityError(null);
    try {
      const analytics = await analyticsService.getCommunityAnalytics(params.communityId, params.period, params.start, params.end);
      setCommunityAnalytics(analytics);
      return analytics;
    } catch (err: unknown) {
      setCommunityError(err instanceof Error ? err : new Error('Unknown error'));
      return [];
    } finally {
      setCommunityLoading(false);
    }
  }, [params.communityId, params.period, params.start, params.end]);

  // Fetch user analytics (one-time, not real-time)
  const fetchUserAnalytics = useCallback(async () => {
    if (!params.userId || !params.period || !params.start || !params.end) return [];
    setUserLoading(true);
    setUserError(null);
    try {
      const analytics = await analyticsService.getUserAnalytics(params.userId, params.period, params.start, params.end);
      setUserAnalytics(analytics);
      return analytics;
    } catch (err: unknown) {
      setUserError(err instanceof Error ? err : new Error('Unknown error'));
      return [];
    } finally {
      setUserLoading(false);
    }
  }, [params.userId, params.period, params.start, params.end]);

  // Fetch analytics alerts (one-time, not real-time)
  const fetchAlerts = useCallback(async () => {
    if (!params.communityId) return [];
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      // For one-time fetch, we need to implement a separate method in analyticsService
      // For now, we'll use the subscription method but handle it properly
      return new Promise<AnalyticsAlert[]>((resolve, reject) => {
        const unsubscribe = analyticsService.subscribeToAnalyticsAlerts(
          params.communityId!,
          (alertsData) => {
            setAlerts(alertsData);
            setAlertsError(null);
            setAlertsLoading(false);
            unsubscribe(); // Unsubscribe after first data
            resolve(alertsData);
          },
          (err) => {
            setAlertsError(err instanceof Error ? err : new Error('Unknown error'));
            setAlertsLoading(false);
            reject(err);
          }
        );
      });
    } catch (err: unknown) {
      setAlertsError(err instanceof Error ? err : new Error('Unknown error'));
      setAlertsLoading(false);
      return [];
    }
  }, [params.communityId]);

  return {
    communityAnalytics, communityLoading, communityError, fetchCommunityAnalytics,
    userAnalytics, userLoading, userError, fetchUserAnalytics,
    alerts, alertsLoading, alertsError, fetchAlerts
  };
} 