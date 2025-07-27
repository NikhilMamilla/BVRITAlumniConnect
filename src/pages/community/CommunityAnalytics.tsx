// CommunityAnalytics.tsx
// Placeholder for CommunityAnalytics main page

import React, { useState, useMemo } from 'react';
import { useCommunityContext } from './contexts/CommunityContext';
import { useCommunityAnalytics } from './hooks/useCommunityAnalytics';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { EmptyState } from './components/common/EmptyState';
import { ShieldAlert, BarChart2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { subDays, format } from 'date-fns';
import { AnalyticsPeriod } from './types/analytics.types';

const CommunityAnalyticsPage: React.FC = () => {
    const { currentCommunity, isAdmin, isOwner } = useCommunityContext();
    const [period, setPeriod] = useState<AnalyticsPeriod>('daily');
    const [days, setDays] = useState(30);

    const dateRange = useMemo(() => ({
        from: subDays(new Date(), days - 1),
        to: new Date()
    }), [days]);

    const { communityAnalytics, communityLoading, communityError } = useCommunityAnalytics({
        communityId: currentCommunity?.id,
        period: period,
        start: dateRange.from,
        end: dateRange.to
    });
    
    const processedData = useMemo(() => {
        if (!communityAnalytics || communityAnalytics.length === 0) {
            return { summary: { newMembers: 0, totalMessages: 0, newDiscussions: 0 }, timeSeries: [] };
        }
        
        const summary = communityAnalytics.reduce((acc, curr) => {
            acc.newMembers += curr.newMembersCount;
            acc.totalMessages += curr.totalMessages;
            acc.newDiscussions += curr.totalDiscussions;
            return acc;
        }, { newMembers: 0, totalMessages: 0, newDiscussions: 0 });

        const timeSeries = communityAnalytics.map(item => ({
            date: format(item.period.start.toDate(), 'MMM d'),
            members: item.newMembersCount,
            messages: item.totalMessages,
            discussions: item.totalDiscussions,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return { summary, timeSeries };
    }, [communityAnalytics]);

    if (!isAdmin && !isOwner) {
        return (
            <EmptyState
                icon={<ShieldAlert className="h-12 w-12 text-destructive" />}
                title="Access Denied"
                description="You do not have permission to view community analytics."
            />
        );
    }

    if (!currentCommunity) {
        return (
            <EmptyState 
                icon={<BarChart2 className="h-12 w-12" />}
                title="No Community Selected"
                description="Analytics will be available once a community is selected."
            />
        );
    }
    
    const chartConfig = {
      members: { label: "New Members", color: "#8884d8" },
      messages: { label: "Messages", color: "#82ca9d" },
      discussions: { label: "Discussions", color: "#ffc658" },
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Community Analytics</h2>
                    <p className="text-muted-foreground">Insights into your community's engagement.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={days === 7 ? 'secondary' : 'outline'} onClick={() => { setDays(7); setPeriod('daily'); }}>7 Days</Button>
                    <Button variant={days === 30 ? 'secondary' : 'outline'} onClick={() => { setDays(30); setPeriod('daily'); }}>30 Days</Button>
                    <Button variant={days === 90 ? 'secondary' : 'outline'} onClick={() => { setDays(90); setPeriod('daily'); }}>90 Days</Button>
                </div>
            </header>

            {communityLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
            
            {!communityLoading && communityError && (
                <Card className="text-center p-8">
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription>{communityError.message}</CardDescription>
                </Card>
            )}

            {!communityLoading && !communityError && (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Members</CardTitle>
                                <CardDescription>All time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{currentCommunity.memberCount || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>New Members</CardTitle>
                                <CardDescription>In last {days} days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{processedData.summary.newMembers}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Messages</CardTitle>
                                <CardDescription>In last {days} days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{processedData.summary.totalMessages}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>New Discussions</CardTitle>
                                <CardDescription>In last {days} days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{processedData.summary.newDiscussions}</div>
                            </CardContent>
                        </Card>
                    </div>
                
                    {processedData.timeSeries.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Over Time</CardTitle>
                                <CardDescription>Daily new members, messages, and discussions.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={processedData.timeSeries}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="members" fill={chartConfig.members.color} radius={4} />
                                        <Bar dataKey="messages" fill={chartConfig.messages.color} radius={4} />
                                        <Bar dataKey="discussions" fill={chartConfig.discussions.color} radius={4} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default CommunityAnalyticsPage; 