// NotificationBell.tsx
// Placeholder for NotificationBell component

import React from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';

// If you have MUI, use these imports:
// import Badge from '@mui/material/Badge';
// import IconButton from '@mui/material/IconButton';
// import NotificationsIcon from '@mui/icons-material/Notifications';

// Fallback SVG bell icon
const BellIcon = ({ filled = false }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16z"
      fill={filled ? '#1976d2' : 'currentColor'}
    />
  </svg>
);

export default function NotificationBell({ onClick }: { onClick?: () => void }) {
  const { unreadCount, preferences } = useNotificationContext();

  // Cap the badge display (e.g., 99+)
  const badgeContent = unreadCount > 99 ? '99+' : unreadCount;
  const hasUnread = unreadCount > 0;

  // Defensive: check if push channel is available (not used now)
  // const pushAvailable = preferences?.channels?.push;

  return (
    <button
      className={`notification-bell${hasUnread ? ' has-unread' : ''}`}
      aria-label={hasUnread ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
      onClick={onClick}
      tabIndex={0}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Bell Icon */}
      <BellIcon filled={hasUnread} />
      {/* Badge */}
      {hasUnread && (
        <span
          className="notification-badge"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#d32f2f',
            color: '#fff',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            fontWeight: 700,
            boxShadow: '0 0 0 2px #fff',
            zIndex: 1,
            transition: 'transform 0.2s',
          }}
        >
          {badgeContent}
        </span>
      )}
      {/* Removed push notification dot and requestPushPermission logic */}
    </button>
  );
} 