// Leaderboard.tsx
// Placeholder for Leaderboard component

import React, { useMemo } from 'react';
import { useCommunityGamification } from '../../hooks/useCommunityGamification';
import type { LeaderboardEntry } from '../../types/gamification.types';

interface LeaderboardProps {
  leaderboardId: string;
  currentUserId?: string;
  className?: string;
}

const rankIcons = [
  '🥇', // 1st
  '🥈', // 2nd
  '🥉', // 3rd
];

function getRankIcon(rank: number) {
  return rank <= 3 ? rankIcons[rank - 1] : null;
}

export default function Leaderboard({ leaderboardId, currentUserId, className }: LeaderboardProps) {
  const {
    leaderboardEntries,
    leaderboardLoading,
    leaderboardError,
  } = useCommunityGamification(currentUserId || '', { leaderboardId });

  // Sort entries by currentRank (should already be sorted, but just in case)
  const sortedEntries = useMemo(() => {
    return [...leaderboardEntries].sort((a, b) => a.currentRank - b.currentRank);
  }, [leaderboardEntries]);

  if (leaderboardLoading) {
    return <div className={className || 'leaderboard-loading'}>Loading leaderboard...</div>;
  }
  if (leaderboardError) {
    return <div className={className || 'leaderboard-error'}>Error loading leaderboard: {leaderboardError.message}</div>;
  }
  if (!sortedEntries.length) {
    return <div className={className || 'leaderboard-empty'}>No leaderboard data available.</div>;
  }

  return (
    <div className={className || 'gamification-leaderboard'} style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Rank</th>
            <th style={{ padding: '12px 8px', textAlign: 'left' }}>User</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Badges</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Score</th>
            <th style={{ padding: '12px 8px', textAlign: 'center' }}>Δ Rank</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => {
            const isCurrentUser = currentUserId && entry.userId === currentUserId;
            const rankIcon = getRankIcon(entry.currentRank);
            return (
              <tr
                key={entry.userId}
                style={{
                  background: isCurrentUser ? '#e3f2fd' : 'transparent',
                  fontWeight: isCurrentUser ? 700 : 400,
                  transition: 'background 0.3s',
                }}
                tabIndex={0}
                aria-label={isCurrentUser ? 'Your position' : undefined}
              >
                <td style={{ textAlign: 'center', fontSize: 22, padding: '10px 0' }}>
                  {rankIcon || entry.currentRank}
                </td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.userName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1976d2' }} />
                  ) : (
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#eee', display: 'inline-block' }} />
                  )}
                  <span>{entry.userName}</span>
                  {isCurrentUser && <span style={{ marginLeft: 6, color: '#1976d2', fontWeight: 800 }}>(You)</span>}
                </td>
                <td style={{ textAlign: 'center', padding: '10px 0' }}>
                  {entry.displayBadges && entry.displayBadges.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {entry.displayBadges.slice(0, 3).map((badgeId) => (
                        <span key={badgeId} title={badgeId} style={{ fontSize: 18 }}>🏅</span>
                      ))}
                      {entry.displayBadges.length > 3 && <span style={{ fontSize: 14, color: '#888' }}>+{entry.displayBadges.length - 3}</span>}
                    </div>
                  ) : (
                    <span style={{ color: '#bbb' }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: '#43a047', padding: '10px 0' }}>{entry.score}</td>
                <td style={{ textAlign: 'center', color: entry.rankChange < 0 ? '#43a047' : entry.rankChange > 0 ? '#e53935' : '#888', fontWeight: 600, padding: '10px 0' }}>
                  {entry.rankChange === 0 ? '—' : entry.rankChange > 0 ? `▼${entry.rankChange}` : `▲${-entry.rankChange}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`
        .gamification-leaderboard tr:focus {
          outline: 2px solid #1976d2;
        }
        @media (max-width: 600px) {
          .gamification-leaderboard table, .gamification-leaderboard thead, .gamification-leaderboard tbody, .gamification-leaderboard th, .gamification-leaderboard td, .gamification-leaderboard tr {
            display: block;
          }
          .gamification-leaderboard tr {
            margin-bottom: 12px;
            border-radius: 8px;
            box-shadow: 0 1px 4px #0001;
            background: #fff;
          }
          .gamification-leaderboard td {
            padding: 8px 12px;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
} 