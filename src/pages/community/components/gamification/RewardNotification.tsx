// RewardNotification.tsx
// Placeholder for RewardNotification component

import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import type { GamificationNotification } from '../../types/gamification.types';

// Firestore 'in' query supports max 10 items. If you add more types, split into multiple queries.
const GAMIFICATION_TYPES: GamificationNotification['type'][] = [
  'points_earned',
  'badge_unlocked',
  'level_up',
  'streak_milestone',
  'leaderboard_position',
  'challenge_available',
  'challenge_completed',
  'peer_recognition',
  'milestone_reached',
];

interface RewardNotificationProps {
  userId: string;
  className?: string;
  maxVisible?: number;
}

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

export default function RewardNotification({ userId, className, maxVisible = 3 }: RewardNotificationProps) {
  const [notifications, setNotifications] = useState<GamificationNotification[]>([]);
  const [visible, setVisible] = useState<GamificationNotification[]>([]);
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Real-time Firestore listener for gamification notifications
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('type', 'in', GAMIFICATION_TYPES),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ notificationId: doc.id, ...doc.data() } as GamificationNotification));
      setNotifications(notifs);
    });
    return () => {
      unsub();
      // Clear all timeouts
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [userId]);

  // Show new notifications as toasts/popups
  useEffect(() => {
    if (!notifications.length) return;
    // Only show unread and not already visible
    const newNotifs = notifications.filter(n => !n.isRead && !visible.some(v => v.notificationId === n.notificationId));
    newNotifs.slice(0, maxVisible - visible.length).forEach(n => {
      setVisible(v => [...v, n]);
      // Auto-dismiss after 6s
      timeoutRefs.current[n.notificationId] = setTimeout(() => {
        setVisible(v => v.filter(vn => vn.notificationId !== n.notificationId));
      }, 6000);
    });
  }, [notifications, visible, maxVisible]);

  // Dismiss handler
  const dismiss = (id: string) => {
    setVisible(v => v.filter(n => n.notificationId !== id));
    if (timeoutRefs.current[id]) clearTimeout(timeoutRefs.current[id]);
  };

  // UI
  return (
    <div
      className={className || 'gamification-reward-notification'}
      style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000 }}
      aria-live="polite"
    >
      {visible.map(n => (
        <div
          key={n.notificationId}
          role="alert"
          aria-live="assertive"
          tabIndex={0}
          style={{
            minWidth: 320,
            maxWidth: 380,
            marginBottom: 18,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 24px #1976d255',
            border: '2px solid #1976d2',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            animation: 'fadeInUp 0.5s',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 36, marginRight: 8 }}>
            {n.iconUrl ? <img src={n.iconUrl} alt="icon" style={{ width: 36, height: 36 }} /> : getCelebrationStyle(n.celebrationStyle)}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1976d2', marginBottom: 2 }}>{n.title}</div>
            <div style={{ fontSize: 14, color: '#444', marginBottom: 4 }}>{n.message}</div>
            {n.actionData && n.actionData.points !== undefined && <div style={{ fontSize: 13, color: '#43a047', fontWeight: 600 }}>+{n.actionData.points} pts</div>}
            {n.actionData && n.actionData.badgeId && <div style={{ fontSize: 13, color: '#ffb300', fontWeight: 600 }}>🏅 Badge Unlocked!</div>}
            {n.actionData && n.actionData.newLevel !== undefined && <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 600 }}>Level Up: {n.actionData.newLevel}</div>}
            {n.actionData && n.actionData.streakDays !== undefined && <div style={{ fontSize: 13, color: '#00bcd4', fontWeight: 600 }}>🔥 Streak: {n.actionData.streakDays} days</div>}
            {n.actionData && n.actionData.rank !== undefined && <div style={{ fontSize: 13, color: '#8e24aa', fontWeight: 600 }}>🏆 Rank: {n.actionData.rank}</div>}
          </div>
          <button
            onClick={() => dismiss(n.notificationId)}
            aria-label="Dismiss notification"
            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}
          >
            ×
          </button>
          {/* Celebration animation (simple emoji, can be replaced with confetti lib) */}
          {n.showCelebration && (
            <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 28, pointerEvents: 'none', opacity: 0.7 }}>
              {getCelebrationStyle(n.celebrationStyle)}
            </span>
          )}
        </div>
      ))}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 