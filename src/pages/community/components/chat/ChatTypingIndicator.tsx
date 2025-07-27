// ChatTypingIndicator.tsx
// Placeholder for ChatTypingIndicator component

import React, { useMemo } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { chatConfig } from '../../config/chatConfig';
import { Timestamp } from 'firebase/firestore';

// Modern, accessible, animated typing indicator
export default function ChatTypingIndicator() {
  const { typingIndicators } = useChatContext();
  const { currentCommunity, currentMember } = useCommunityContext();

  // Filter typing indicators for this community and not expired
  const activeTyping = useMemo(() => {
    if (!currentCommunity?.id) return [];
    const now = Timestamp.now();
    return typingIndicators
      .filter(
        (t) =>
          t.communityId === currentCommunity.id &&
          t.expiresAt.toMillis() > now.toMillis() &&
          t.userId !== currentMember?.userId // Optionally hide self
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [typingIndicators, currentCommunity?.id, currentMember?.userId]);

  if (!activeTyping.length) return null;

  // Format names for display
  const names = activeTyping.map((t) => t.displayName);
  let typingText = '';
  if (names.length === 1) {
    typingText = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    typingText = `${names[0]} and ${names[1]} are typing...`;
  } else if (names.length === 3) {
    typingText = `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
  } else {
    typingText = `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
  }

  return (
    <div
      className="chat-typing-indicator"
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {activeTyping.slice(0, 3).map((t) => (
          <img
            key={t.userId}
            src={t.photoURL || '/avatar-default.png'}
            alt={t.displayName}
            className="chat-typing-avatar"
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #eee' }}
          />
        ))}
        {activeTyping.length > 3 && (
          <span className="chat-typing-more" style={{ fontSize: 14, color: '#888' }}>+{activeTyping.length - 3}</span>
        )}
      </div>
      <span className="chat-typing-text" style={{ fontSize: 15, color: '#666', fontStyle: 'italic', animation: 'fadeIn 0.3s' }}>{typingText}</span>
      <span className="chat-typing-dots" aria-hidden="true" style={{ marginLeft: 4, fontSize: 18, letterSpacing: 1 }}>
        <span className="dot" style={{ animation: 'blink 1.2s infinite' }}>.</span>
        <span className="dot" style={{ animation: 'blink 1.2s 0.2s infinite' }}>.</span>
        <span className="dot" style={{ animation: 'blink 1.2s 0.4s infinite' }}>.</span>
      </span>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
        .chat-typing-indicator { transition: opacity 0.2s; }
      `}</style>
    </div>
  );
} 