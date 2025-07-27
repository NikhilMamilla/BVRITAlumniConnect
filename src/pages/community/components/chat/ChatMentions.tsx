// ChatMentions.tsx
// Placeholder for ChatMentions component

import React, { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { useCommunityMembers } from '../../hooks/useCommunityMembers';
import { MentionType, MessageMention } from '../../types/chat.types';
import type { DetailedCommunityMember } from '../../types/member.types';
import { chatConfig } from '../../config/chatConfig';

interface ChatMentionsProps {
  communityId: string;
  currentUserId: string;
  onSelect: (mention: MessageMention) => void;
  onClose?: () => void;
  maxResults?: number;
}

const SPECIAL_MENTIONS = [
  { id: 'everyone', type: MentionType.EVERYONE, displayName: 'Everyone' },
  { id: 'moderators', type: MentionType.MODERATORS, displayName: 'Moderators' },
  { id: 'alumni', type: MentionType.ALUMNI, displayName: 'Alumni' },
];

export default function ChatMentions({
  communityId,
  currentUserId,
  onSelect,
  onClose,
  maxResults = 8,
}: ChatMentionsProps) {
  const [search, setSearch] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Real-time members
  const { members, loading } = useCommunityMembers(communityId, {
    filters: search
      ? { searchQuery: search, searchFields: ['displayName', 'bio', 'skills', 'interests', 'customTitle'] }
      : undefined,
    sortOptions: { field: 'displayName', direction: 'asc' },
  });

  // Filtered members (exclude self, dedupe, limit)
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(
      m => m.userId !== currentUserId &&
        m.userDetails &&
        typeof m.userDetails.name === 'string' &&
        m.userDetails.name &&
        (!search || m.userDetails.name.toLowerCase().includes(search.toLowerCase()))
    );
    // Remove duplicates by userId
    const seen = new Set<string>();
    filtered = filtered.filter(m => {
      if (seen.has(m.userId)) return false;
      seen.add(m.userId);
      return true;
    });
    return filtered.slice(0, maxResults);
  }, [members, search, currentUserId, maxResults]);

  // Special mentions (always shown at top if search is empty)
  const showSpecialMentions = useMemo(() => {
    if (search.trim()) return [];
    return SPECIAL_MENTIONS;
  }, [search]);

  // Combined list
  type SpecialMention = { id: string; type: MentionType; displayName: string };
  type UserMention = { id: string; type: MentionType.USER; userId: string; displayName: string; roleType: string };
  type MentionListItem = SpecialMention | UserMention;
  const mentionList: MentionListItem[] = useMemo(() => [
    ...showSpecialMentions,
    ...filteredMembers.map(m => ({
      id: m.userId,
      type: MentionType.USER as const,
      userId: m.userId,
      displayName: m.userDetails.name,
      roleType: m.role,
    })),
  ], [showSpecialMentions, filteredMembers]);

  // Focus management
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('button.mention-item');
      if (items[focusedIdx]) (items[focusedIdx] as HTMLButtonElement).focus();
    }
  }, [focusedIdx, mentionList.length]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setFocusedIdx(i => (i + 1) % mentionList.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setFocusedIdx(i => (i - 1 + mentionList.length) % mentionList.length);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (mentionList[focusedIdx]) handleSelect(mentionList[focusedIdx]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      onClose?.();
      e.preventDefault();
    }
  };

  // Select mention
  const handleSelect = (mention: MentionListItem) => {
    if (mention.type === MentionType.USER) {
      const userMention = mention as UserMention;
      const m: MessageMention = {
        id: userMention.id,
        type: userMention.type,
        userId: userMention.userId,
        roleType: userMention.roleType,
        displayName: userMention.displayName,
        startIndex: -1,
        endIndex: -1,
      };
      onSelect(m);
    } else {
      const m: MessageMention = {
        id: mention.id,
        type: mention.type,
        displayName: mention.displayName,
        startIndex: -1,
        endIndex: -1,
      };
      onSelect(m);
    }
    onClose?.();
  };

  // Autofocus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="chat-mentions-picker"
      role="dialog"
      aria-modal="true"
      aria-label="Mention Picker"
      tabIndex={-1}
      style={{ minWidth: 260, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 2px 16px #0002', padding: 12, zIndex: 100, outline: 'none' }}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={e => { setSearch(e.target.value); setFocusedIdx(0); }}
        style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
        aria-label="Search members"
        autoFocus
      />
      <div
        ref={listRef}
        className="mentions-list"
        style={{ maxHeight: 260, overflowY: 'auto' }}
        role="listbox"
        aria-label="Mention list"
      >
        {mentionList.length === 0 && (
          <div style={{ padding: 12, color: '#888' }}>No members found</div>
        )}
        {mentionList.map((mention, idx) => (
          <button
            key={mention.id + mention.type}
            className="mention-item"
            role="option"
            aria-selected={focusedIdx === idx}
            tabIndex={focusedIdx === idx ? 0 : -1}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: focusedIdx === idx ? '#e0f7fa' : 'none',
              border: focusedIdx === idx ? '2px solid #00bcd4' : '1px solid #eee',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 6,
              marginBottom: 4,
              fontSize: 16,
              outline: 'none',
              textAlign: 'left',
              gap: 8,
            }}
            onClick={() => handleSelect(mention)}
            onFocus={() => setFocusedIdx(idx)}
          >
            {mention.type === MentionType.USER && (
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#eee', display: 'inline-block', overflow: 'hidden', marginRight: 8 }}>
                {/* Optionally show avatar if available */}
                {/* <img src={mention.avatar} alt={mention.displayName} style={{ width: '100%', height: '100%' }} /> */}
                <span style={{ fontWeight: 600, color: '#00bcd4' }}>@</span>
              </span>
            )}
            {mention.type !== MentionType.USER && (
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5f5f5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#888', marginRight: 8 }}>
                @{mention.displayName}
              </span>
            )}
            <span style={{ fontWeight: 500 }}>{mention.displayName}</span>
            {mention.type === MentionType.USER && 'roleType' in mention && mention.roleType && (
              <span style={{ marginLeft: 8, fontSize: 13, color: '#888' }}>{mention.roleType}</span>
            )}
          </button>
        ))}
      </div>
      <style>{`
        .chat-mentions-picker { animation: fadeIn 0.18s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .mention-item:focus { outline: 2px solid #00bcd4; }
      `}</style>
    </div>
  );
} 