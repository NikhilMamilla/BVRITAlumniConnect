// MessageReactions.tsx
// Placeholder for MessageReactions component

import React, { useMemo, useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { ReactionType, MessageReaction, ChatMessage } from '../../types/chat.types';
import { chatConfig } from '../../config/chatConfig';
import { addReaction as addReactionHelper, removeReaction as removeReactionHelper, hasReaction } from '../../utils/chatHelpers';

interface MessageReactionsProps {
  message: ChatMessage;
}

const REACTION_EMOJIS = chatConfig.reactionTypes as ReactionType[];
const MAX_REACTIONS = chatConfig.limits.maxReactionsPerMessage || 50;

export default function MessageReactions({ message }: MessageReactionsProps) {
  const { addReaction, removeReaction } = useChatContext();
  const { currentMember } = useCommunityContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const userId = currentMember?.userId;

  // Group reactions by emoji
  const grouped = useMemo(() => {
    const map: Record<string, MessageReaction[]> = {};
    for (const r of message.reactions) {
      if (!map[r.emoji]) map[r.emoji] = [];
      map[r.emoji].push(r);
    }
    return map;
  }, [message.reactions]);

  // User's reactions (by emoji)
  const userReactions = useMemo(() => {
    if (!userId) return new Set<string>();
    return new Set(message.reactions.filter(r => r.userId === userId).map(r => r.emoji));
  }, [message.reactions, userId]);

  // Add or remove reaction
  const handleToggleReaction = async (emoji: string) => {
    if (!userId) return;
    const existing = message.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (existing) {
      await removeReaction(message.id, existing.id);
    } else {
      if (message.reactions.length >= MAX_REACTIONS) return;
      const reaction: Omit<MessageReaction, 'id' | 'createdAt'> = {
        type: emoji as ReactionType,
        emoji,
        userId,
        userInfo: {
          displayName: currentMember.userDetails.name,
          photoURL: currentMember.userDetails.avatar,
        },
      };
      await addReaction(message.id, reaction);
    }
  };

  // Add new reaction from picker
  const handleAddReaction = (emoji: string) => {
    setPickerOpen(false);
    handleToggleReaction(emoji);
  };

  // Avatars for a reaction
  const renderAvatars = (reactions: MessageReaction[]) => (
    <span className="reaction-avatars" style={{ display: 'inline-flex', marginLeft: 4 }}>
      {reactions.slice(0, 3).map(r => (
        <img
          key={r.userId}
          src={r.userInfo.photoURL || '/avatar-default.png'}
          alt={r.userInfo.displayName}
          title={r.userInfo.displayName}
          style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', marginLeft: -6 }}
        />
      ))}
      {reactions.length > 3 && (
        <span style={{ fontSize: 12, color: '#888', marginLeft: 2 }}>+{reactions.length - 3}</span>
      )}
    </span>
  );

  // Render all grouped reactions
  return (
    <div className="message-reactions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
      {Object.entries(grouped).map(([emoji, reactions]) => {
        const reacted = userReactions.has(emoji);
        return (
          <button
            key={emoji}
            className={`reaction-btn${reacted ? ' reacted' : ''}`}
            onClick={() => handleToggleReaction(emoji)}
            aria-pressed={reacted}
            aria-label={reacted ? `Remove your ${emoji} reaction` : `React with ${emoji}`}
            style={{
              display: 'inline-flex', alignItems: 'center', border: 'none', background: reacted ? '#e0f7fa' : '#f5f5f5', borderRadius: 16, padding: '2px 8px', cursor: 'pointer', fontSize: 16, fontWeight: 500, transition: 'background 0.2s', boxShadow: reacted ? '0 1px 4px #b2ebf2' : undefined
            }}
          >
            <span>{emoji}</span>
            <span style={{ marginLeft: 4, fontSize: 13 }}>{reactions.length}</span>
            {renderAvatars(reactions)}
          </button>
        );
      })}
      {/* Reaction Picker */}
      {message.reactions.length < MAX_REACTIONS && (
        <div style={{ position: 'relative' }}>
          <button
            className="reaction-picker-btn"
            onClick={() => setPickerOpen(v => !v)}
            aria-label="Add reaction"
            style={{
              display: 'inline-flex', alignItems: 'center', border: 'none', background: '#f5f5f5', borderRadius: 16, padding: '2px 8px', cursor: 'pointer', fontSize: 16, fontWeight: 500, marginLeft: 2
            }}
          >
            ＋
          </button>
          {pickerOpen && (
            <div
              className="reaction-picker-popover"
              style={{
                position: 'absolute', top: 32, left: 0, zIndex: 10, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 12px #0001', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6
              }}
              role="menu"
              aria-label="Pick a reaction"
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-picker-emoji"
                  onClick={() => handleAddReaction(emoji)}
                  style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, padding: 2, transition: 'background 0.15s' }}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`
        .reaction-btn.reacted { background: #e0f7fa !important; box-shadow: 0 1px 4px #b2ebf2; }
        .reaction-btn:focus, .reaction-picker-emoji:focus { outline: 2px solid #00bcd4; }
        .reaction-picker-popover { animation: fadeIn 0.18s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
} 