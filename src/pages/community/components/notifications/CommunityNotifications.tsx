// CommunityNotifications.tsx
// Placeholder for CommunityNotifications component

import React, { useState, useCallback } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';
import NotificationSettings from './NotificationSettings';
import NotificationItem from './NotificationItem';
import { formatNotification, isRead } from '../../utils/notificationHelpers';

export default function CommunityNotifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences,
    analytics,
    fetchMoreNotifications,
  } = useNotificationContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Infinite scroll handler (for fallback, NotificationDropdown handles its own)
  const handleFetchMore = useCallback(async () => {
    if (fetchingMore || !hasMore || notifications.length === 0) return;
    setFetchingMore(true);
    const lastNotif = notifications[notifications.length - 1];
    const more = await fetchMoreNotifications(
      undefined,
      'createdAt',
      'desc',
      20,
      lastNotif
    );
    if (!more || more.length === 0) setHasMore(false);
    setFetchingMore(false);
  }, [fetchingMore, hasMore, notifications, fetchMoreNotifications]);

  // Keyboard accessibility for bell/settings
  const handleBellKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') setShowDropdown(v => !v);
  };
  const handleSettingsKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') setShowSettings(v => !v);
  };

  // UI
  return (
    <div className="notification-center" style={{ position: 'relative', zIndex: 100 }}>
      <div className="notification-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
        <NotificationBell
          onClick={() => setShowDropdown(v => !v)}
        />
        <button
          onClick={() => setShowSettings(v => !v)}
          onKeyDown={handleSettingsKeyDown}
          aria-label="Notification Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          ⚙️
        </button>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          aria-label="Mark all as read"
          style={{ background: 'none', border: 'none', color: unreadCount === 0 ? '#aaa' : '#1976d2', cursor: unreadCount === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          Mark all as read
        </button>
      </div>
      {showDropdown && (
        <div className="notification-dropdown" style={{ position: 'absolute', top: 40, right: 0 }}>
          <NotificationDropdown />
        </div>
      )}
      {showSettings && (
        <div className="notification-settings-modal" style={{ position: 'absolute', top: 40, right: 0, zIndex: 200 }}>
          <NotificationSettings />
        </div>
      )}
    </div>
  );
} 