// ChatEmojiPicker.tsx
// Placeholder for ChatEmojiPicker component

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { chatConfig } from '../../config/chatConfig';
import { ReactionType } from '../../types/chat.types';

const EMOJI_NAMES: Record<string, string> = {
  '👍': 'Thumbs Up',
  '❤️': 'Heart',
  '😂': 'Laugh',
  '😮': 'Wow',
  '😢': 'Sad',
  '😠': 'Angry',
  '🎉': 'Celebrate',
  '🔥': 'Fire',
  '👏': 'Clap',
  '🤔': 'Thinking',
};

interface ChatEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  recentEmojis?: string[];
  maxRecent?: number;
}

const STORAGE_KEY = 'chat_recent_emojis';
const ALL_EMOJIS = chatConfig.reactionTypes as ReactionType[];
const DEFAULT_MAX_RECENT = 8;

function getRecentEmojis(max: number): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, max);
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji: string, max: number) {
  try {
    let arr = getRecentEmojis(max);
    arr = [emoji, ...arr.filter(e => e !== emoji)].slice(0, max);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Intentionally ignore localStorage errors (e.g., quota exceeded)
  }
}

export default function ChatEmojiPicker({ onSelect, onClose, recentEmojis, maxRecent = DEFAULT_MAX_RECENT }: ChatEmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [localRecent, setLocalRecent] = useState<string[]>(() => recentEmojis || getRecentEmojis(maxRecent));

  // Filtered emojis
  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_EMOJIS;
    const s = search.toLowerCase();
    return ALL_EMOJIS.filter(e =>
      e.includes(s) || (EMOJI_NAMES[e] && EMOJI_NAMES[e].toLowerCase().includes(s))
    );
  }, [search]);

  // Combined recent + filtered (no dups)
  const showRecent = (recentEmojis || localRecent).filter((e): e is ReactionType => (filtered as string[]).includes(e) && (ALL_EMOJIS as string[]).includes(e));
  const showEmojis = filtered.filter(e => !showRecent.includes(e));
  const emojiList = [...showRecent, ...showEmojis];

  // Focus management
  useEffect(() => {
    if (gridRef.current) {
      const btns = gridRef.current.querySelectorAll('button.emoji-btn');
      if (btns[focusedIdx]) (btns[focusedIdx] as HTMLButtonElement).focus();
    }
  }, [focusedIdx, emojiList.length]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setFocusedIdx(i => (i + 1) % emojiList.length);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setFocusedIdx(i => (i - 1 + emojiList.length) % emojiList.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setFocusedIdx(i => (i - 5 + emojiList.length) % emojiList.length);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setFocusedIdx(i => (i + 5) % emojiList.length);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      handleSelect(emojiList[focusedIdx]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      onClose?.();
      e.preventDefault();
    }
  };

  // Select emoji
  const handleSelect = (emoji: string) => {
    saveRecentEmoji(emoji, maxRecent);
    setLocalRecent(getRecentEmojis(maxRecent));
    onSelect(emoji);
    onClose?.();
  };

  return (
    <div
      className="chat-emoji-picker"
      role="dialog"
      aria-modal="true"
      aria-label="Emoji Picker"
      tabIndex={-1}
      style={{ minWidth: 260, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 2px 16px #0002', padding: 12, zIndex: 100, outline: 'none' }}
      onKeyDown={handleKeyDown}
    >
      <input
        type="text"
        placeholder="Search emoji..."
        value={search}
        onChange={e => { setSearch(e.target.value); setFocusedIdx(0); }}
        style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
        aria-label="Search emoji"
        autoFocus
      />
      <div
        ref={gridRef}
        className="emoji-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}
        role="listbox"
        aria-label="Emoji list"
      >
        {emojiList.map((emoji, idx) => (
          <button
            key={emoji}
            className="emoji-btn"
            role="option"
            aria-selected={focusedIdx === idx}
            tabIndex={focusedIdx === idx ? 0 : -1}
            style={{
              fontSize: 26,
              background: focusedIdx === idx ? '#e0f7fa' : 'none',
              border: focusedIdx === idx ? '2px solid #00bcd4' : '1px solid #eee',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 4,
              transition: 'background 0.15s, border 0.15s',
              outline: 'none',
            }}
            title={EMOJI_NAMES[emoji] || emoji}
            onClick={() => handleSelect(emoji)}
            onFocus={() => setFocusedIdx(idx)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <style>{`
        .chat-emoji-picker { animation: fadeIn 0.18s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .emoji-btn:focus { outline: 2px solid #00bcd4; }
      `}</style>
    </div>
  );
} 