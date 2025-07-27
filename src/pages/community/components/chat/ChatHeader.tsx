import React, { useMemo } from 'react';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { chatConfig } from '../../config/chatConfig';
import { communityConfig } from '../../config/communityConfig';
import { realtimeConfig } from '../../config/realtimeConfig';
import { formatRelativeTime } from '../../utils/dateHelpers';
import { DEFAULTS } from '../../utils/constants';
import { Search } from 'lucide-react';

export default function ChatHeader({ onSearchClick }) {
  const {
    currentCommunity,
    currentMember,
    isModerator,
    isAdmin,
    isOwner,
    isBanned,
    loadingCommunity,
    loadingMember,
    members,
  } = useCommunityContext();

  const { presences, typingIndicators } = useChatContext();

  // Memoized values
  const onlinePresences = useMemo(() => presences || [], [presences]);
  const typingUsers = useMemo(() => {
    if (!typingIndicators) return [];
    return typingIndicators.map(t => t.displayName || t.userId).filter(Boolean);
  }, [typingIndicators]);

  // Community data
  const isArchived = currentCommunity?.isArchived;
  const lastActivity = currentCommunity?.lastActivity;
  const engagementScore = currentCommunity?.engagementScore;
  const userRole = currentMember?.role;
  const isMuted = currentMember?.moderation?.isMuted;
  const isSuspended = currentMember?.moderation?.isSuspended;
  const joinDate = currentMember?.joinedAt;
  const currentLevel = currentMember?.gamification?.currentLevel;
  const totalPoints = currentMember?.gamification?.totalPoints;

  if (loadingCommunity || loadingMember) {
    return (
      <div className="chat-header loading">
        Loading chat header...
      </div>
    );
  }

  if (!currentCommunity) {
    return (
      <div className="chat-header error">
        No community selected
      </div>
    );
  }

  return (
    <header
      className="chat-header real-time"
      aria-label="Chat Header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '20px 28px 12px 28px',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 12px #0001',
        margin: 16,
        marginBottom: 0,
        minHeight: 90,
      }}
    >
      {/* Main header row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 20 
      }}>
        {/* Community Avatar */}
        {currentCommunity.avatar ? (
          <img
            src={currentCommunity.avatar}
            alt={currentCommunity.name + ' avatar'}
            className="community-avatar"
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 12, 
              objectFit: 'cover', 
              boxShadow: '0 1px 4px #0001' 
            }}
          />
        ) : (
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 12, 
            background: '#e0e7ef', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 700, 
            fontSize: 28, 
            color: '#3b82f6', 
            boxShadow: '0 1px 4px #0001' 
          }}>
            {currentCommunity.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        {/* Community Info */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10 
          }}>
            {currentCommunity.emoji && (
              <span style={{ fontSize: 26 }}>
                {currentCommunity.emoji}
              </span>
            )}
            <span style={{ 
              fontWeight: 700, 
              fontSize: 22, 
              color: '#222' 
            }}>
              {currentCommunity.name}
            </span>
            <span style={{ 
              fontSize: 14, 
              color: '#3b82f6', 
              background: '#f0f6ff', 
              borderRadius: 6, 
              padding: '2px 8px', 
              marginLeft: 6 
            }}>
              {currentCommunity.category}
            </span>
            {isArchived && (
              <span style={{ 
                fontSize: 13, 
                color: '#fff', 
                background: '#f59e42', 
                borderRadius: 6, 
                padding: '2px 8px', 
                marginLeft: 6 
              }}>
                Archived
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: 15, 
            color: '#666', 
            marginTop: 2 
          }}>
            {currentCommunity.description}
          </div>
        </div>

        {/* Search Button */}
        <button
          aria-label="Search messages"
          onClick={onSearchClick}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: 8, 
            borderRadius: 8, 
            cursor: 'pointer', 
            color: '#3b82f6', 
            marginLeft: 16 
          }}
        >
          <Search size={24} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 24, 
        marginTop: 6, 
        marginLeft: 76 
      }}>
        <span style={{ 
          fontSize: 15, 
          color: '#3b82f6', 
          fontWeight: 600 
        }}>
          <span 
            className="dot-online" 
            style={{ 
              display: 'inline-block', 
              width: 8, 
              height: 8, 
              borderRadius: 4, 
              background: '#22c55e', 
              marginRight: 5, 
              verticalAlign: 'middle' 
            }} 
          />
          {onlinePresences.length} online
        </span>
        
        <span style={{ 
          fontSize: 15, 
          color: '#666' 
        }}>
          {currentCommunity.memberCount} members
        </span>
        
        {typeof engagementScore === 'number' && (
          <span style={{ 
            fontSize: 15, 
            color: '#666' 
          }}>
            Engagement: {engagementScore}
          </span>
        )}
        
        {lastActivity && (
          <span style={{ 
            fontSize: 15, 
            color: '#888' 
          }}>
            Last activity: {formatRelativeTime(lastActivity)}
          </span>
        )}
      </div>

      {/* User info row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16, 
        marginTop: 8, 
        marginLeft: 76 
      }}>
        {currentMember && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            background: '#f9f9fb', 
            borderRadius: 8, 
            padding: '6px 14px', 
            boxShadow: '0 1px 4px #0001' 
          }}>
            {/* User Avatar */}
            {currentMember.userDetails?.avatar ? (
              <img
                src={currentMember.userDetails.avatar}
                alt={currentMember.userDetails.name || 'You'}
                className="user-avatar"
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 8, 
                  objectFit: 'cover' 
                }}
              />
            ) : (
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 8, 
                background: '#e0e7ef', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 700, 
                fontSize: 16, 
                color: '#3b82f6' 
              }}>
                {currentMember.userDetails?.name?.[0]?.toUpperCase() || 'Y'}
              </div>
            )}
            
            <span style={{ 
              fontWeight: 600, 
              color: '#222' 
            }}>
              {currentMember.userDetails?.name || 'You'}
            </span>
            
            <span style={{ 
              fontSize: 13, 
              color: '#3b82f6', 
              background: '#eaf3ff', 
              borderRadius: 6, 
              padding: '2px 8px' 
            }}>
              {userRole}
            </span>
            
            {joinDate && (
              <span style={{ 
                fontSize: 13, 
                color: '#888', 
                marginLeft: 8 
              }}>
                Joined {formatRelativeTime(joinDate)}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}