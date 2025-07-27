// AchievementModal.tsx
// Placeholder for AchievementModal component

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import type { GamificationNotification } from '../../types/gamification.types';

const ACHIEVEMENT_TYPES: GamificationNotification['type'][] = [
  'badge_unlocked',
  'level_up',
  'streak_milestone',
  'challenge_completed',
  'milestone_reached',
];

function getCelebrationStyle(style: string) {
  switch (style) {
    case 'confetti':
      return '🎉';
    case 'fireworks':
      return '🎆';
    case 'badge_rain':
      return '🏅';
    case 'level_up':
      return '🚀';
    default:
      return '🎊';
  }
}

interface AchievementModalProps {
  userId: string;
  className?: string;
}

export default function AchievementModal({ userId, className }: AchievementModalProps) {
  const [modal, setModal] = useState<GamificationNotification | null>(null);
  const [queue, setQueue] = useState<GamificationNotification[]>([]);

  // Real-time Firestore listener for achievement notifications
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', 'in', ACHIEVEMENT_TYPES),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ notificationId: doc.id, ...doc.data() } as GamificationNotification));
      setQueue(notifs);
      if (notifs.length && !modal) setModal(notifs[0]);
    });
    return () => unsub();
    // eslint-disable-next-line
  }, [userId]);

  // Show next modal when current is dismissed
  const handleClose = () => {
    setModal(null);
    setTimeout(() => {
      setQueue(q => {
        const [, ...rest] = q;
        if (rest.length) setModal(rest[0]);
        return rest;
      });
    }, 300);
  };

  if (!modal) return null;

  return (
    <div
      className={className || 'gamification-achievement-modal'}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#0008',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: 36,
          minWidth: 320,
          maxWidth: 420,
          boxShadow: '0 4px 24px #0003',
          position: 'relative',
          textAlign: 'center',
          animation: 'popIn 0.4s',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close achievement modal"
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, color: '#888', cursor: 'pointer' }}
        >
          ×
        </button>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {modal.iconUrl ? <img src={modal.iconUrl} alt="icon" style={{ width: 56, height: 56 }} /> : getCelebrationStyle(modal.celebrationStyle)}
        </div>
        <div style={{ fontWeight: 800, fontSize: 24, color: '#1976d2', marginBottom: 8 }}>{modal.title}</div>
        <div style={{ fontSize: 16, color: '#444', marginBottom: 12 }}>{modal.message}</div>
        {modal.actionData?.points && <div style={{ fontSize: 15, color: '#43a047', fontWeight: 600, marginBottom: 6 }}>+{modal.actionData.points} pts</div>}
        {modal.actionData?.badgeId && <div style={{ fontSize: 15, color: '#ffb300', fontWeight: 600, marginBottom: 6 }}>🏅 Badge Unlocked!</div>}
        {modal.actionData?.newLevel && <div style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginBottom: 6 }}>Level Up: {modal.actionData.newLevel}</div>}
        {modal.actionData?.streakDays && <div style={{ fontSize: 15, color: '#00bcd4', fontWeight: 600, marginBottom: 6 }}>🔥 Streak: {modal.actionData.streakDays} days</div>}
        {modal.actionData?.rank && <div style={{ fontSize: 15, color: '#8e24aa', fontWeight: 600, marginBottom: 6 }}>🏆 Rank: {modal.actionData.rank}</div>}
        <div style={{ marginTop: 18, fontSize: 13, color: '#888' }}>Congratulations! Keep going 🚀</div>
        {/* Celebration animation (simple emoji, can be replaced with confetti lib) */}
        {modal.showCelebration && (
          <span style={{ position: 'absolute', left: 24, top: 24, fontSize: 36, pointerEvents: 'none', opacity: 0.7 }}>
            {getCelebrationStyle(modal.celebrationStyle)}
          </span>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
} 