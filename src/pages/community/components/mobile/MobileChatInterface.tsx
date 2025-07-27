// MobileChatInterface.tsx
// Placeholder for MobileChatInterface component

import React, { useMemo, useRef } from 'react';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { chatConfig } from '../../config/chatConfig';
import ChatHeader from '../chat/ChatHeader';
import ChatMessageThread from '../chat/ChatMessageThread';
import ChatInput from '../chat/ChatInput';
import ChatTypingIndicator from '../chat/ChatTypingIndicator';
import ChatScrollToBottom from '../chat/ChatScrollToBottom';
import { useCommunityPermissions } from '../../hooks/useCommunityPermissions';

export default function MobileChatInterface() {
  const {
    currentCommunity,
    currentMember,
    loadingCommunity,
    loadingMember,
    isBanned,
    isMember,
  } = useCommunityContext();
  const { messages } = useChatContext();
  const { features } = chatConfig;
  const { isOwner } = useCommunityPermissions(currentCommunity?.id || '', currentMember?.userId || '');


  const threadRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => isMember && !isBanned && features.chat, [isMember, isBanned, features.chat]);
  const canReact = useMemo(() => features.reactions && isMember, [features.reactions, isMember]);
  const canPin = useMemo(() => isMember, [isMember]);
  const canBookmark = useMemo(() => isMember, [isMember]);
  const canModerate = useMemo(() => isMember, [isMember]);


  if (loadingCommunity || loadingMember) {
    return <div className="p-4">Loading chat...</div>;
  }

  if (!currentCommunity) {
    return <div className="p-4">No community selected.</div>;
  }

  if (isBanned) {
    return <div className="p-4 text-red-500">You are banned from this community chat.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader />
      <div ref={threadRef} className="flex-1 overflow-y-auto p-4">
        <ChatMessageThread />
        <ChatScrollToBottom containerRef={threadRef} messages={messages} />
      </div>
      <ChatTypingIndicator />
      {canSend && <ChatInput />}
    </div>
  );
} 