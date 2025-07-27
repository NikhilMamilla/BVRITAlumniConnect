// PointsSystem.tsx
// Placeholder for PointsSystem component

import React, { useMemo } from 'react';
import { useCommunityGamification } from '../../hooks/useCommunityGamification';
import type { UserPoints } from '../../types/gamification.types';
import { DEFAULT_POINTS, EVENT_TYPE_CONFIG } from '../../config/gamificationConfig';

interface PointsSystemProps {
  userId: string;
  communityId?: string;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  communityPoints: 'Community',
  helpfulnessPoints: 'Helpfulness',
  participationPoints: 'Participation',
  leadershipPoints: 'Leadership',
  learningPoints: 'Learning',
  mentorshipPoints: 'Mentorship',
  creativePoints: 'Creativity',
  socialPoints: 'Social',
};

export default function PointsSystem({ userId, communityId, className }: PointsSystemProps) {
  const { points, pointsLoading, pointsError } = useCommunityGamification(userId);

  // Memoize breakdown for performance
  const breakdown = useMemo(() => {
    if (!points) return [];
    return (Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][]).map(([key, label]) => ({
      label,
      value: (points[key as keyof UserPoints] as number) ?? 0,
    }));
  }, [points]);

  // Memoize event/action table
  const eventRows = useMemo(() => {
    return Object.entries(DEFAULT_POINTS).map(([event, basePoints]) => {
      const config = EVENT_TYPE_CONFIG[event as keyof typeof EVENT_TYPE_CONFIG];
      return {
        event,
        label: event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        basePoints,
        cooldown: config?.cooldownMinutes ?? '-',
        maxDaily: config?.maxDaily ?? '-',
      };
    });
  }, []);

  // Multipliers/bonuses
  const multipliers = [
    { label: 'Current Multiplier', value: typeof points?.currentMultiplier === 'number' ? points.currentMultiplier : '-' },
    { label: 'Bonus Points Available', value: typeof points?.bonusPointsAvailable === 'number' ? points.bonusPointsAvailable : '-' },
    { label: 'Premium Bonus', value: typeof points?.premiumBonus === 'number' ? points.premiumBonus : '-' },
  ];

  return (
    <div
      className={className || 'gamification-points-system'}
      style={{ maxWidth: 600, margin: '0 auto', padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}
      aria-label="Points System Overview"
      role="region"
    >
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#1976d2' }}>Points System</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#1976d2' }}>Total Points</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#222', margin: '6px 0' }}>
            {pointsLoading ? '...' : pointsError ? 'Error' : points?.totalPoints || 0}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>Lifetime: {points?.lifetimePoints || 0}</div>
        </div>
        <div style={{ flex: 2, minWidth: 220 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Breakdown</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#444' }}>
            {breakdown.map(b => (
              <li key={b.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>{b.label}</span>
                <span style={{ fontWeight: 600 }}>{b.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Recent</div>
          <div style={{ fontSize: 14, color: '#444' }}>Today: <b>{points?.pointsEarnedToday || 0}</b></div>
          <div style={{ fontSize: 14, color: '#444' }}>Week: <b>{points?.weeklyPoints || 0}</b></div>
          <div style={{ fontSize: 14, color: '#444' }}>Month: <b>{points?.monthlyPoints || 0}</b></div>
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Multipliers & Bonuses</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: '#444' }}>
          {multipliers.map(m => (
            <li key={m.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>{m.label}</span>
              <span style={{ fontWeight: 600 }}>{m.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>How to Earn Points</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#f9fafe', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#e3eafc', color: '#1976d2' }}>
              <th style={{ textAlign: 'left', padding: 8, fontWeight: 700 }}>Action</th>
              <th style={{ textAlign: 'center', padding: 8, fontWeight: 700 }}>Points</th>
              <th style={{ textAlign: 'center', padding: 8, fontWeight: 700 }}>Cooldown</th>
              <th style={{ textAlign: 'center', padding: 8, fontWeight: 700 }}>Max/Day</th>
            </tr>
          </thead>
          <tbody>
            {eventRows.map(row => (
              <tr key={row.event} style={{ borderBottom: '1px solid #e0e7ef' }}>
                <td style={{ padding: 8 }}>{row.label}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{row.basePoints}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{row.cooldown}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{row.maxDaily}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pointsError && (
        <div style={{ color: '#f44336', marginTop: 12, fontSize: 13 }}>Error loading points. Please try again.</div>
      )}
    </div>
  );
} 