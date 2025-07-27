// ChatScrollToBottom.tsx
// Placeholder for ChatScrollToBottom component

import React, { useEffect, useState, useCallback } from 'react';
import type { ChatMessage } from '../../types/chat.types';

interface ChatScrollToBottomProps {
  containerRef: React.RefObject<HTMLDivElement>;
  messages: ChatMessage[];
  unreadCount?: number;
  onScrollToBottom?: () => void;
}

export default function ChatScrollToBottom({
  containerRef,
  messages,
  unreadCount: unreadCountProp,
  onScrollToBottom,
}: ChatScrollToBottomProps) {
  const [showButton, setShowButton] = useState(false);
  const [unread, setUnread] = useState(0);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Helper: is user at bottom
  const isAtBottom = useCallback(() => {
    if (!containerRef || !containerRef.current) return true;
    const el = containerRef.current;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 32; // 32px threshold
  }, [containerRef]);

  // On scroll, check if at bottom
  useEffect(() => {
    if (!containerRef || !containerRef.current) return;
    const el = containerRef.current;
    const handleScroll = () => {
      if (isAtBottom()) {
        setShowButton(false);
        setUnread(0);
      } else {
        setShowButton(true);
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef, isAtBottom]);

  // On new messages, if not at bottom, show button and increment unread
  useEffect(() => {
    if (!messages.length) return;
    if (!containerRef || !containerRef.current) return;
    const latestId = messages[messages.length - 1].id;
    if (lastMessageId && latestId !== lastMessageId && !isAtBottom()) {
      setShowButton(true);
      setUnread(u => u + 1);
    }
    setLastMessageId(latestId);
    // If at bottom, reset unread
    if (isAtBottom()) setUnread(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (!containerRef || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowButton(false);
    setUnread(0);
    if (onScrollToBottom) onScrollToBottom();
  }, [containerRef, onScrollToBottom]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      scrollToBottom();
    }
  };

  // Use prop unreadCount if provided
  const displayUnread = typeof unreadCountProp === 'number' ? unreadCountProp : unread;

  if (!showButton && displayUnread === 0) return null;

  return (
    <button
      className="chat-scroll-to-bottom"
      onClick={scrollToBottom}
      onKeyDown={handleKeyDown}
      aria-label="Scroll to bottom"
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 100,
        background: '#00bcd4',
        color: '#fff',
        border: 'none',
        borderRadius: 24,
        padding: '10px 22px',
        fontWeight: 600,
        fontSize: 16,
        boxShadow: '0 2px 12px #0002',
        cursor: 'pointer',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'opacity 0.2s',
        opacity: showButton ? 1 : 0,
      }}
      tabIndex={0}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>↓</span>
      <span>Scroll to bottom</span>
      {displayUnread > 0 && (
        <span style={{
          background: '#fff',
          color: '#00bcd4',
          borderRadius: 12,
          padding: '2px 8px',
          fontWeight: 700,
          fontSize: 14,
          marginLeft: 6,
        }}>{displayUnread}</span>
      )}
    </button>
  );
} 