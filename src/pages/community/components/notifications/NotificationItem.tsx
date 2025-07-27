// NotificationItem.tsx
// Placeholder for NotificationItem component

import React from 'react';
import type { Notification } from '../../types/notification.types';
import { isRead, formatNotification, getPrimaryAction } from '../../utils/notificationHelpers';
import { Timestamp } from 'firebase/firestore';

function formatTimestamp(ts?: Timestamp) {
  if (!ts || typeof ts.toDate !== 'function') return '';
  const date = ts.toDate();
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function NotificationAvatar({ notification }: { notification: Notification }) {
  if (notification.senderAvatar) {
    return (
      <img
        src={notification.senderAvatar}
        alt={notification.senderName || 'Sender'}
        className="notification-avatar"
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }}
      />
    );
  }
  // Fallback icon (SVG)
  return (
    <span
      className="notification-avatar-fallback"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#e3f2fd',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: '#1976d2',
        marginRight: 12,
      }}
      aria-label="Notification"
    >
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 15h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6zm0 16a2 2 0 0 0 2-2H8a2 2 0 0 0 2 2z" /></svg>
    </span>
  );
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  formatNotification: customFormat,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  formatNotification?: (n: Notification) => string;
}) {
  const read = isRead(notification);
  const primaryAction = getPrimaryAction(notification);
  const handleClick = (e: React.MouseEvent) => {
    // If notification has a deep link or primary action, handle it
    if (primaryAction && primaryAction.url) {
      window.open(primaryAction.url, '_blank', 'noopener');
    } else if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank', 'noopener');
    }
    // Mark as read on click
    if (!read && typeof onMarkAsRead === 'function') onMarkAsRead();
  };

  return (
    <div
      className={`notification-item${read ? ' read' : ' unread'}`}
      tabIndex={0}
      role="button"
      aria-label={notification.title ?? 'Notification'}
      aria-pressed={read}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '12px 16px',
        background: read ? '#f5f5f5' : '#e3f2fd',
        cursor: 'pointer',
        borderLeft: read ? '4px solid transparent' : '4px solid #1976d2',
        transition: 'background 0.2s',
        outline: 'none',
      }}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Keyboard accessibility: trigger the same logic as click
          const read = isRead(notification);
          const primaryAction = getPrimaryAction(notification);
          if (primaryAction && primaryAction.url) {
            window.open(primaryAction.url, '_blank', 'noopener');
          } else if (notification.actionUrl) {
            window.open(notification.actionUrl, '_blank', 'noopener');
          }
          if (!read && typeof onMarkAsRead === 'function') onMarkAsRead();
        }
      }}
    >
      <NotificationAvatar notification={notification} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#222', fontSize: 15, marginRight: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notification.title ?? 'Notification'}</span>
          <span style={{ color: '#888', fontSize: 12 }}>{formatTimestamp(notification.createdAt)}</span>
        </div>
        <div style={{ color: '#444', fontSize: 14, margin: '4px 0 0 0', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {(customFormat || formatNotification)(notification) ?? notification.message ?? ''}
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {!read && (
            <button
              onClick={e => { e.stopPropagation(); if (typeof onMarkAsRead === 'function') onMarkAsRead(); }}
              aria-label="Mark as read"
              style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 600 }}
            >
              Mark as read
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); if (typeof onDelete === 'function') onDelete(); }}
            aria-label="Delete notification"
            style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontWeight: 600 }}
          >
            Delete
          </button>
          {/* Render custom actions if any */}
          {(notification.actions ?? []).map(action => (
            <button
              key={action.id}
              onClick={e => {
                e.stopPropagation();
                if (action.url) window.open(action.url, '_blank', 'noopener');
                // Optionally, handle other action types here
              }}
              aria-label={action.text}
              style={{
                background: action.style === 'primary' ? '#1976d2' : action.style === 'danger' ? '#d32f2f' : '#f5f5f5',
                color: action.style === 'primary' || action.style === 'danger' ? '#fff' : '#1976d2',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 