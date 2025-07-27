// MemberBadges.tsx
// Placeholder for MemberBadges component

import React, { useEffect, useState, useMemo } from 'react';
import { useCommunityGamification } from '../../hooks/useCommunityGamification';
import type { UserBadge, Badge } from '../../types/gamification.types';
import { gamificationService } from '../../services/gamificationService';

interface MemberBadgesProps {
  userId: string;
  communityId?: string;
  className?: string;
}

export default function MemberBadges({ userId, communityId, className }: MemberBadgesProps) {
  const { badges: userBadges, badgesLoading, badgesError } = useCommunityGamification(userId);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Fetch all badge metadata (one-time, not real-time)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Use a new method to fetch all badges
        const snapshot = await gamificationService.getAllBadgesFromCollection();
        if (mounted) setAllBadges(snapshot || []);
      } catch (err) {
        setError('Failed to load badge metadata');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Map user badges by badgeId for quick lookup
  const userBadgesMap = useMemo(() => {
    const map: Record<string, UserBadge> = {};
    userBadges.forEach(b => { map[b.badgeId] = b; });
    return map;
  }, [userBadges]);

  // Merge badge metadata with user progress
  const badgeRows = useMemo(() => {
    return allBadges.map(badge => {
      const userBadge = userBadgesMap[badge.badgeId];
      return {
        ...badge,
        userBadge,
        earned: !!userBadge?.isCompleted,
        inProgress: !!userBadge && !userBadge.isCompleted,
        progress: userBadge?.completionPercentage || 0,
      };
    });
  }, [allBadges, userBadgesMap]);

  // Sort: earned first, then in-progress, then locked
  const sortedBadges = useMemo(() => {
    return badgeRows.sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      if (a.inProgress && !b.inProgress) return -1;
      if (!a.inProgress && b.inProgress) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [badgeRows]);

  // UI
  return (
    <div
      className={className || 'gamification-member-badges'}
      style={{ maxWidth: 700, margin: '0 auto', padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}
      aria-label="Member Badges"
      role="region"
    >
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: '#1976d2' }}>Badges</h2>
      {badgesLoading || loading ? (
        <div style={{ color: '#1976d2', fontWeight: 500 }}>Loading badges...</div>
      ) : badgesError || error ? (
        <div style={{ color: '#f44336', fontWeight: 500 }}>{badgesError?.message || error}</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {sortedBadges.map(badge => (
            <div
              key={badge.badgeId}
              tabIndex={0}
              aria-label={badge.name + (badge.earned ? ' (earned)' : badge.inProgress ? ' (in progress)' : ' (locked)')}
              style={{
                width: 110,
                minHeight: 140,
                background: badge.earned ? '#e3fcec' : badge.inProgress ? '#fffbe6' : '#f5f5f5',
                border: badge.earned ? '2px solid #43a047' : badge.inProgress ? '2px solid #ffb300' : '2px solid #eee',
                borderRadius: 10,
                boxShadow: badge.earned ? '0 2px 8px #43a04722' : undefined,
                opacity: badge.earned ? 1 : 0.7,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: 10,
                position: 'relative',
                outline: 'none',
              }}
              onClick={() => setSelectedBadge(badge)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedBadge(badge); }}
              title={badge.description}
            >
              <img
                src={badge.iconUrl}
                alt={badge.name}
                style={{ width: 48, height: 48, marginBottom: 8, filter: badge.earned ? 'none' : 'grayscale(1) opacity(0.6)' }}
              />
              <div style={{ fontWeight: 600, fontSize: 15, color: badge.earned ? '#43a047' : badge.inProgress ? '#ffb300' : '#888', textAlign: 'center', marginBottom: 4 }}>
                {badge.name}
              </div>
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 4 }}>{badge.category}</div>
              {badge.earned ? (
                <div style={{ fontSize: 12, color: '#43a047', fontWeight: 600 }}>Earned</div>
              ) : badge.inProgress ? (
                <div style={{ fontSize: 12, color: '#ffb300', fontWeight: 600 }}>In Progress ({badge.progress}%)</div>
              ) : (
                <div style={{ fontSize: 12, color: '#aaa' }}>Locked</div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Badge details modal */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 320, maxWidth: 420, boxShadow: '0 4px 24px #0003', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              aria-label="Close badge details"
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}
            >
              ×
            </button>
            <img src={selectedBadge.iconUrl} alt={selectedBadge.name} style={{ width: 64, height: 64, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', marginBottom: 6 }}>{selectedBadge.name}</div>
            <div style={{ fontSize: 14, color: '#555', marginBottom: 10 }}>{selectedBadge.description}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Category: {selectedBadge.category}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Difficulty: {selectedBadge.difficulty}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Rarity: {selectedBadge.rarity}</div>
            {selectedBadge.requirements && (
              <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>
                <b>Requirements:</b>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  {selectedBadge.requirements.map((req, i) => (
                    <li key={i}>{req.type.replace(/_/g, ' ')}: {req.value}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedBadge.pointsReward > 0 && (
              <div style={{ fontSize: 13, color: '#43a047', marginTop: 8 }}>Reward: {selectedBadge.pointsReward} pts</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 