// CommunityAnalytics.tsx
// Placeholder for CommunityAnalytics component

import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../../services/analyticsService';
import { CommunityAnalytics, AnalyticsPeriod } from '../../types/analytics.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

interface CommunityAnalyticsProps {
  communityId: string;
}

const analyticsService = AnalyticsService.getInstance();

const CommunityAnalyticsComponent: React.FC<CommunityAnalyticsProps> = ({ communityId }) => {
  const [analytics, setAnalytics] = useState<CommunityAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<AnalyticsPeriod>('daily');

  useEffect(() => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30); // Default to last 30 days

    // Use the correct service method signature
    const unsubscribe = analyticsService.subscribeToCommunityAnalytics(
      communityId,
      period,
      (data) => {
        setAnalytics(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load analytics:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId, period]);

  const formattedData = analytics
    .map(a => ({
        name: (a.period.start as unknown as Timestamp).toDate().toLocaleDateString(),
        newMembers: a.newMembersCount,
        messages: a.totalMessages,
    }))
    .reverse();

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const latestAnalytics = analytics[0] || {};
  const { totalMessages = 0, averageResponseTime = 0 } = latestAnalytics as any;

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Community Analytics</CardTitle>
            <CardDescription>Displaying {period} analytics for the last 30 days.</CardDescription>
        </div>
        <div className="w-[180px]">
            <Select onValueChange={(value: AnalyticsPeriod) => setPeriod(value)} defaultValue={period}>
                <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {analytics.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader><CardTitle>Total Members</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{(latestAnalytics as any).studentsCount + (latestAnalytics as any).alumniCount}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Total Messages</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalMessages}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Avg. Response Time</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{averageResponseTime}s</p></CardContent>
              </Card>
            </div>
            <h3 className="text-lg font-semibold mb-4">New Members Over Time ({period})</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newMembers" stroke="#8884d8" name="New Members" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p>No analytics data available yet for the selected period.</p>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default CommunityAnalyticsComponent; 