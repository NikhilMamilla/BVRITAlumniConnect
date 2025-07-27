// NotificationSettings.tsx
// Placeholder for NotificationSettings component

import React, { useEffect, useState } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import type {
  NotificationPreferences,
  NotificationCategory,
  NotificationType,
  NotificationChannel,
  CategoryPreference,
  TypePreference,
} from '../../types/notification.types';
import { NotificationCategory as CategoryEnum, NotificationType as TypeEnum, NotificationChannel as ChannelEnum } from '../../types/notification.types';
import { CATEGORY_DEFAULT_PREFERENCES } from '../../config/notificationConfig';

function ChannelToggle({
  channel,
  checked,
  onChange,
  disabled = false,
}: {
  channel: NotificationChannel;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={{ marginRight: 16, opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
      />{' '}
      {channel.charAt(0).toUpperCase() + channel.slice(1)}
    </label>
  );
}

function QuietHoursEditor({
  quietHours,
  onChange,
}: {
  quietHours: NotificationPreferences['quietHours'];
  onChange: (qh: NotificationPreferences['quietHours']) => void;
}) {
  return (
    <fieldset style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 16 }}>
      <legend style={{ fontWeight: 600 }}>Quiet Hours</legend>
      <label>
        <input
          type="checkbox"
          checked={quietHours.enabled}
          onChange={e => onChange({ ...quietHours, enabled: e.target.checked })}
        />{' '}
        Enable Quiet Hours
      </label>
      {quietHours.enabled && (
        <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label>
            Start Time:{' '}
            <input
              type="time"
              value={quietHours.startTime}
              onChange={e => onChange({ ...quietHours, startTime: e.target.value })}
            />
          </label>
          <label>
            End Time:{' '}
            <input
              type="time"
              value={quietHours.endTime}
              onChange={e => onChange({ ...quietHours, endTime: e.target.value })}
            />
          </label>
          <label>
            Timezone:{' '}
            <input
              type="text"
              value={quietHours.timezone}
              onChange={e => onChange({ ...quietHours, timezone: e.target.value })}
              style={{ width: 100 }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={quietHours.weekdaysOnly}
              onChange={e => onChange({ ...quietHours, weekdaysOnly: e.target.checked })}
            />{' '}
            Weekdays Only
          </label>
        </div>
      )}
    </fieldset>
  );
}

export default function NotificationSettings() {
  const {
    preferences,
    updatePreferences,
    loading,
    error,
  } = useNotificationContext();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (preferences) setLocalPrefs(preferences);
  }, [preferences]);

  if (!localPrefs) return <div>Loading preferences...</div>;

  // Handlers
  const handleGlobalToggle = (enabled: boolean) => {
    setLocalPrefs(p => p ? { ...p, enabled } : p);
  };
  const handleChannelToggle = (channel: NotificationChannel, checked: boolean) => {
    setLocalPrefs(p => p ? { ...p, channels: { ...p.channels, [channel]: checked } } : p);
  };
  const handleCategoryToggle = (cat: NotificationCategory, checked: boolean) => {
    setLocalPrefs(p => p ? {
      ...p,
      categories: {
        ...p.categories,
        [cat]: { ...p.categories[cat], enabled: checked },
      },
    } : p);
  };
  const handleCategoryChannelToggle = (cat: NotificationCategory, channel: NotificationChannel, checked: boolean) => {
    setLocalPrefs(p => p ? {
      ...p,
      categories: {
        ...p.categories,
        [cat]: {
          ...p.categories[cat],
          channels: checked
            ? Array.from(new Set([...p.categories[cat].channels, channel]))
            : p.categories[cat].channels.filter(c => c !== channel),
        },
      },
    } : p);
  };
  const handleQuietHoursChange = (qh: NotificationPreferences['quietHours']) => {
    setLocalPrefs(p => p ? { ...p, quietHours: qh } : p);
  };
  // Save
  const handleSave = async () => {
    if (!localPrefs) return;
    setSaving(true);
    setSuccess(false);
    try {
      await updatePreferences(localPrefs);
      setSuccess(true);
    } catch (e) {
      // error handled by context
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };
  // Reset
  const handleReset = () => {
    if (preferences) setLocalPrefs(preferences);
  };

  return (
    <form
      className="notification-settings"
      style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 24 }}
      onSubmit={e => { e.preventDefault(); handleSave(); }}
      aria-label="Notification Settings"
    >
      <h2 style={{ marginBottom: 16 }}>Notification Settings</h2>
      {error && <div style={{ color: '#d32f2f', marginBottom: 12 }}>{error.message || error.toString()}</div>}
      <label style={{ display: 'block', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={localPrefs.enabled}
          onChange={e => handleGlobalToggle(e.target.checked)}
        />{' '}
        Enable all notifications
      </label>
      <fieldset style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 16 }}>
        <legend style={{ fontWeight: 600 }}>Channels</legend>
        {Object.values(ChannelEnum).map(channel => (
          <ChannelToggle
            key={channel}
            channel={channel}
            checked={localPrefs.channels[channel]}
            onChange={checked => handleChannelToggle(channel, checked)}
          />
        ))}
      </fieldset>
      <QuietHoursEditor quietHours={localPrefs.quietHours} onChange={handleQuietHoursChange} />
      <fieldset style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 16 }}>
        <legend style={{ fontWeight: 600 }}>Categories</legend>
        {Object.values(CategoryEnum).map(cat => (
          <div key={cat} style={{ marginBottom: 12, padding: 8, background: '#fafbfc', borderRadius: 4 }}>
            <label style={{ fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={localPrefs.categories[cat]?.enabled ?? false}
                onChange={e => handleCategoryToggle(cat, e.target.checked)}
              />{' '}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </label>
            <div style={{ marginLeft: 24, marginTop: 4 }}>
              {Object.values(ChannelEnum).map(channel => (
                <ChannelToggle
                  key={channel}
                  channel={channel}
                  checked={localPrefs.categories[cat]?.channels.includes(channel) ?? false}
                  onChange={checked => handleCategoryChannelToggle(cat, channel, checked)}
                  disabled={!localPrefs.categories[cat]?.enabled}
                />
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      {/* Digest and type-specific settings can be added here as needed */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          type="submit"
          disabled={saving || loading}
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving || loading}
          style={{ background: '#f5f5f5', color: '#1976d2', border: 'none', borderRadius: 4, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}
        >
          Reset
        </button>
        {success && <span style={{ color: '#388e3c', fontWeight: 600, alignSelf: 'center' }}>Saved!</span>}
      </div>
    </form>
  );
} 