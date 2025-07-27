import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';
import { chatConfig } from '../../config/chatConfig';
import ChatHeader from './ChatHeader';
import ChatMessageThread from './ChatMessageThread';
import ChatInput from './ChatInput';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatMediaUpload from './ChatMediaUpload';
import ChatScrollToBottom from './ChatScrollToBottom';
import MessageSearch from './MessageSearch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/AuthContext';
import { MemberService } from '../../services/memberService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function ChatContainer() {
  const {
    currentCommunity,
    currentMember,
    loadingCommunity,
    loadingMember,
    isBanned,
    isMember,
    isModerator,
    isAdmin,
    permissions,
    setCurrentCommunityId,
  } = useCommunityContext();

  const {
    messages,
    loading,
    error,
    typingIndicators,
    presences,
    setPresence,
    clearPresence,
  } = useChatContext();

  const { features } = chatConfig;
  const { isOwner } = useCommunityPermissions(currentCommunity?.id || '', currentMember?.userId || '');
  const threadRef = useRef<HTMLDivElement>(null);

  // Permission checks
  const canSend = useMemo(() => isMember && !isBanned && features.chat, [isMember, isBanned, features.chat]);
  const canUpload = useMemo(() => features.attachments && !isBanned && isMember, [features.attachments, isBanned, isMember]);
  const canReact = useMemo(() => features.reactions && isMember, [features.reactions, isMember]);
  const canPin = useMemo(() => isModerator || isAdmin || isOwner, [isModerator, isAdmin, isOwner]);
  const canBookmark = useMemo(() => isMember, [isMember]);
  const canModerate = useMemo(() => isModerator || isAdmin || isOwner, [isModerator, isAdmin, isOwner]);

  const { currentUser } = useAuth();
  const [joining, setJoining] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleJoin = async () => {
    if (!currentUser || !currentCommunity) return;
    setJoining(true);
    try {
      await MemberService.getInstance().joinCommunity(currentUser, currentCommunity.id);
      toast.success('You have joined the community!');
      setJustJoined(true);
      setCurrentCommunityId(currentCommunity.id);
    } catch (err) {
      toast.error('Failed to join community.');
    } finally {
      setJoining(false);
    }
  };

  React.useEffect(() => {
    if (justJoined && isMember) setJustJoined(false);
  }, [justJoined, isMember]);

  // Presence heartbeat: mark user as online when chat is open
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      isMember &&
      !isBanned &&
      currentMember?.userId &&
      currentCommunity?.id &&
      setPresence
    ) {
      const updatePresence = () => {
        setPresence(
          currentMember.userId,
          currentCommunity.id,
          'online',
          (typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) ? 'mobile' : 'desktop',
          navigator.userAgent
        );
      };
      updatePresence();
      interval = setInterval(updatePresence, 30000); // every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
      if (
        isMember &&
        !isBanned &&
        currentMember?.userId &&
        currentCommunity?.id &&
        clearPresence
      ) {
        clearPresence(currentMember.userId, currentCommunity.id);
      }
    };
  }, [isMember, isBanned, currentMember?.userId, currentCommunity?.id, setPresence, clearPresence]);

  // Loading states
  if (loadingCommunity || loadingMember) {
    return (
      <div className="chat-loading" role="status">
        Loading chat...
      </div>
    );
  }

  if (!currentCommunity) {
    return (
      <div className="chat-error" role="alert">
        No community selected.
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="chat-banned" role="alert">
        You are banned from this community chat.
      </div>
    );
  }

  if (!isMember) {
    if (justJoined) {
      return (
        <div style={{ 
          padding: 48, 
          textAlign: 'center', 
          color: '#888' 
        }}>
          <div style={{ 
            fontSize: 18, 
            marginBottom: 16 
          }}>
            Joining community...
          </div>
          <div 
            className="loader" 
            style={{ 
              margin: '24px auto', 
              width: 40, 
              height: 40, 
              border: '4px solid #eee', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} 
          />
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      );
    }

    return (
      <div 
        className="chat-not-member" 
        role="alert" 
        style={{ 
          padding: 24, 
          textAlign: 'center', 
          color: '#888' 
        }}
      >
        <div style={{ 
          fontSize: 18, 
          marginBottom: 8 
        }}>
          Join this community to participate in chat.
        </div>
        <div style={{ 
          opacity: 0.7 
        }}>
          Only members can send messages.
        </div>
        
        <form className="chat-input" style={{ marginTop: 24 }}>
          <textarea
            className="chat-input-textarea"
            placeholder="You must join the community to chat."
            disabled
            rows={2}
          />
          <button 
            type="button" 
            className="send-btn" 
            disabled 
            style={{ 
              opacity: 0.5, 
              cursor: 'not-allowed' 
            }}
          >
            ➤
          </button>
        </form>
        
        <Button 
          onClick={handleJoin} 
          disabled={joining} 
          style={{ marginTop: 16 }}
        >
          {joining ? 'Joining...' : 'Join Community'}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error" role="alert">
        {error.message}
      </div>
    );
  }

  return (
    <div
      className="chat-container"
      aria-label="Community Chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 48px)',
        minHeight: 600,
        background: '#f9f9fb',
        borderRadius: 24,
        boxShadow: '0 4px 32px #0001',
        maxWidth: 1100,
        margin: '32px auto',
        padding: 0,
      }}
    >
      <ChatHeader onSearchClick={() => setSearchOpen(true)} />
      
      <div
        className="chat-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          padding: 0,
        }}
      >
        <div
          className="chat-thread-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            position: 'relative',
            background: '#fff',
            borderRadius: 18,
            margin: '0 32px 0 32px',
            boxShadow: '0 2px 12px #0001',
            overflow: 'hidden',
            padding: 0,
            height: '100%',
          }}
        >
          <div
            ref={threadRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              position: 'relative',
              padding: 36,
              gap: 24,
              display: 'flex',
              flexDirection: 'column',
              background: '#f8fafc',
              minHeight: 400,
              maxHeight: '60vh',
            }}
          >
            <ChatMessageThread messages={messages} />
          </div>
          <ChatScrollToBottom containerRef={threadRef} messages={messages} />
        </div>
      </div>

      <ChatTypingIndicator />
      
      {canSend && (
        <div style={{ 
          padding: '0 32px 32px 32px', 
          background: 'transparent', 
          maxWidth: 900, 
          width: '100%', 
          margin: '0 auto' 
        }}>
          <ChatInput />
        </div>
      )}
      
      {canUpload && currentCommunity && currentMember && (
        <div style={{ 
          padding: '0 32px 32px 32px', 
          background: 'transparent', 
          maxWidth: 900, 
          width: '100%', 
          margin: '0 auto' 
        }}>
          <ChatMediaUpload 
            communityId={currentCommunity.id} 
            userId={currentMember.userId} 
          />
        </div>
      )}
      
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent style={{ 
          maxWidth: 900, 
          width: '100%', 
          padding: 0, 
          background: '#fff', 
          borderRadius: 20 
        }}>
          <MessageSearch communityId={currentCommunity.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
}