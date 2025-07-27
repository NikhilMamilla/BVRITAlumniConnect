// NotificationDropdown.tsx
// Placeholder for NotificationDropdown component

import React, { useRef, useCallback } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import { isRead } from '../../utils/notificationHelpers';

export default function NotificationDropdown({
  maxHeight = 400,
  pageSize = 20,
}: {
  maxHeight?: number;
  pageSize?: number;
}) {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    fetchMoreNotifications,
  } = useNotificationContext();
  const listRef = useRef<HTMLUListElement>(null);
  const [fetchingMore, setFetchingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  // Infinite scroll handler
  const handleScroll = useCallback(async () => {
    if (!listRef.current || fetchingMore || !hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 40) {
      setFetchingMore(true);
      const lastNotif = notifications[notifications.length - 1];
      const more = await fetchMoreNotifications(
        undefined,
        'createdAt',
        'desc',
        pageSize,
        lastNotif
      );
      if (!more || more.length === 0) setHasMore(false);
      setFetchingMore(false);
    }
  }, [fetchingMore, hasMore, loading, notifications, fetchMoreNotifications, pageSize]);

  React.useEffect(() => {
    const ref = listRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', handleScroll);
    return () => ref.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div
      className="notification-dropdown"
      role="menu"
      aria-label="Notifications"
      style={{
        minWidth: 320,
        maxWidth: 400,
        maxHeight,
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        zIndex: 1000,
        padding: 0,
      }}
    >
      {loading && <div style={{ padding: 16 }}>Loading notifications...</div>}
      {error && <div className="error" style={{ color: '#d32f2f', padding: 16 }}>{error.message}</div>}
      {notifications.length === 0 && !loading && (
        <div style={{ padding: 16, color: '#888' }}>No notifications</div>
      )}
      <ul
        ref={listRef}
        className="notification-list"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          maxHeight,
          overflowY: 'auto',
        }}
        tabIndex={0}
      >
        {notifications.map((notif) => (
          <li
            key={notif.id}
            className={isRead(notif) ? 'read' : 'unread'}
            style={{
              background: isRead(notif) ? '#f5f5f5' : '#e3f2fd',
              borderBottom: '1px solid #eee',
              padding: 0,
            }}
            role="menuitem"
            aria-label={notif.title}
          >
            <NotificationItem
              notification={notif}
              onMarkAsRead={() => markAsRead(notif.id)}
              onDelete={() => deleteNotification(notif.id)}
            />
          </li>
        ))}
      </ul>
      {hasMore && !loading && (
        <button
          onClick={handleScroll}
          disabled={fetchingMore}
          className="load-more"
          style={{
            width: '100%',
            padding: 12,
            background: '#f5f5f5',
            border: 'none',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            color: '#1976d2',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {fetchingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
} 