// ProgressBar.tsx
// Placeholder for ProgressBar component

import React, { useMemo } from 'react';
import { useCommunityGamification } from '../../hooks/useCommunityGamification';
import type { UserPoints } from '../../types/gamification.types';
import { DEFAULT_LEVELS } from '../../config/gamificationConfig';

interface ProgressBarProps {
  userId: string;
  communityId?: string;
  className?: string;
}

export default function ProgressBar({ userId, communityId, className }: ProgressBarProps) {
  const { points, pointsLoading, pointsError } = useCommunityGamification(userId);

  // Find current and next level config
  const { currentLevel, levelProgress, totalPoints, pointsToNextLevel } = points || {};
  const currentLevelConfig = useMemo(() => DEFAULT_LEVELS.find(l => l.level === currentLevel), [currentLevel]);
  const nextLevelConfig = useMemo(() => DEFAULT_LEVELS.find(l => l.level === (currentLevel || 0) + 1), [currentLevel]);

  // Progress bar width (0-100)
  const progress = typeof levelProgress === 'number' ? Math.max(0, Math.min(100, levelProgress)) : 0;

  // XP/Points to next level display
  const ptsToNext = typeof pointsToNextLevel === 'number' ? pointsToNextLevel : 0;

  // Accessibility label
  const ariaLabel = pointsLoading
    ? 'Loading progress'
    : pointsError
    ? 'Error loading progress'
    : `Level ${currentLevel}, ${progress}% to next level, ${ptsToNext} pts to next level`;

  return (
    <div
      className={className || 'gamification-progress-bar'}
      style={{ maxWidth: 420, margin: '0 auto', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', position: 'relative' }}
      aria-label={ariaLabel}
      role="region"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2' }}>
          Level {currentLevel || 1}
          {/* To add a level icon, extend DEFAULT_LEVELS with an `icon` property and render here. */}
        </div>
        <div style={{ fontSize: 14, color: '#888' }}>
          {pointsLoading ? 'Loading...' : pointsError ? 'Error' : `${totalPoints || 0} pts`}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: 18,
          background: '#e3eafc',
          borderRadius: 9,
          overflow: 'hidden',
          position: 'relative',
        }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progress}%`}
        role="progressbar"
        tabIndex={0}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
            transition: 'width 0.6s cubic-bezier(.4,2,.3,1)',
            borderRadius: 9,
            boxShadow: progress > 0 ? '0 0 8px #1976d2aa' : undefined,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontWeight: 600,
            fontSize: 14,
            color: progress > 50 ? '#fff' : '#1976d2',
            textShadow: progress > 50 ? '0 1px 4px #0008' : undefined,
            pointerEvents: 'none',
          }}
        >
          {pointsLoading ? '...' : `${progress.toFixed(1)}%`}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: '#555' }}>
        <span>Total Points: {totalPoints || 0}</span>
        <span>To Next Level: {ptsToNext} pts</span>
      </div>
      {nextLevelConfig && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#888', textAlign: 'center' }}>
          Next Level: <b>{nextLevelConfig.level}</b> — {nextLevelConfig.pointsReward} pts reward
        </div>
      )}
      {pointsError && (
        <div style={{ color: '#f44336', marginTop: 8, fontSize: 13 }}>Error loading progress. Please try again.</div>
      )}
    </div>
  );
} 