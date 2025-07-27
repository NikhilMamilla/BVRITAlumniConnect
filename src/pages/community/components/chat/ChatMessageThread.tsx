import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { chatConfig } from '../../config/chatConfig';
import { realtimeConfig } from '../../config/realtimeConfig';
import { ChatService } from '../../services/chatService';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { formatRelativeTime } from '../../utils/dateHelpers';
import { isPinned, isEdited, isDeleted, isBookmarked } from '../../utils/chatHelpers';
import { DEFAULTS } from '../../utils/constants';
import type { ChatMessage as ChatMessageType } from '../../types/chat.types';
import ChatMessageComponent from './ChatMessage';
import MessageReactions from './MessageReactions';
import ChatMentions from './ChatMentions';
import ChatMediaUpload from './ChatMediaUpload';
import ChatScrollToBottom from './ChatScrollToBottom';
import ChatTypingIndicator from './ChatTypingIndicator';

export default function ChatMessageThread({ messages }) {
  const { currentMember } = useCommunityContext();

  if (!messages || messages.length === 0) {
    return (
      <div 
        className="thread-empty" 
        style={{ 
          textAlign: 'center', 
          color: '#888', 
          padding: '48px 0', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 16 
        }}
      >
        <div style={{ 
          fontSize: 48, 
          marginBottom: 8 
        }}>
          💬
        </div>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 600 
        }}>
          No messages yet!
        </div>
        <div style={{ 
          fontSize: 16, 
          color: '#666', 
          marginBottom: 8 
        }}>
          Be the first to start the conversation.
        </div>
        <div style={{ 
          fontSize: 15, 
          color: '#3b82f6' 
        }}>
          Type your message below and hit Send.
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 8, 
      width: '100%' 
    }}>
      <ChatTypingIndicator />
      
      {messages.map((msg) => {
        const isMine = currentMember?.userId === msg.authorId;
        
        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: isMine ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 8,
              width: '100%',
            }}
          >
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {msg.authorInfo.photoURL ? (
                <img 
                  src={msg.authorInfo.photoURL} 
                  alt={msg.authorInfo.displayName} 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    background: '#e0e7ef' 
                  }} 
                />
              ) : (
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: '#e0e7ef', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: 15, 
                  color: '#3b82f6' 
                }}>
                  {msg.authorInfo.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div
              style={{
                background: isMine ? '#dbeafe' : '#fff',
                color: '#222',
                borderRadius: 16,
                borderTopRightRadius: isMine ? 4 : 16,
                borderTopLeftRadius: isMine ? 16 : 4,
                boxShadow: '0 1px 4px #0001',
                padding: '10px 16px',
                maxWidth: '70%',
                minWidth: 60,
                marginLeft: isMine ? 0 : 4,
                marginRight: isMine ? 4 : 0,
                wordBreak: 'break-word',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Message Header */}
              <div style={{ 
                fontSize: 13, 
                color: '#666', 
                marginBottom: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6 
              }}>
                <span style={{ fontWeight: 600 }}>
                  {msg.authorInfo.displayName}
                </span>
                <span>
                  {msg.createdAt && typeof msg.createdAt.toDate === 'function' 
                    ? formatRelativeTime(msg.createdAt.toDate()) 
                    : '...'
                  }
                </span>
                {isPinned(msg) && (
                  <span title="Pinned" style={{ color: '#f59e42', fontSize: 15 }}>
                    📌
                  </span>
                )}
                {isEdited(msg) && (
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 2 }}>
                    (edited)
                  </span>
                )}
                {isBookmarked(msg, currentMember?.userId) && (
                  <span style={{ fontSize: 11, color: '#3b82f6', marginLeft: 2 }}>
                    ★
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div style={{ 
                fontSize: 15, 
                color: '#222', 
                marginBottom: 2 
              }}>
                {msg.content}
              </div>

              {/* Message Reactions */}
        <MessageReactions message={msg} />

              {/* Reply Count */}
        {msg.replyCount > 0 && (
                <div 
                  className="thread-replies-info" 
                  style={{ 
                    fontSize: 12, 
                    color: '#3b82f6', 
                    marginTop: 2 
                  }}
                >
            {msg.replyCount} repl{msg.replyCount === 1 ? 'y' : 'ies'}
          </div>
        )}
            </div>
      </div>
        );
      })}
    </div>
  );
} 