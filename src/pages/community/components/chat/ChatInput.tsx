import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { MessageType, AttachmentType, ChatMessageCreate, MentionType, MessageStatus } from '../../types/chat.types';
import { isUserTyping, generateMessageId } from '../../utils/chatHelpers';
import { chatConfig } from '../../config/chatConfig';
import { DEFAULTS } from '../../utils/constants';
import { Timestamp } from 'firebase/firestore';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;

export default function ChatInput() {
  const { currentCommunity, currentMember } = useCommunityContext();
  const {
    sendMessage,
    setTyping,
    clearTyping,
    typingIndicators,
    loading: chatLoading,
  } = useChatContext();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage
  useEffect(() => {
    if (currentCommunity?.id && currentMember?.userId) {
      const key = `chat_draft_${currentCommunity.id}_${currentMember.userId}`;
      const saved = localStorage.getItem(key);
      if (saved) setInput(saved);
    }
  }, [currentCommunity?.id, currentMember?.userId]);

  // Save draft to localStorage
  useEffect(() => {
    if (currentCommunity?.id && currentMember?.userId) {
      const key = `chat_draft_${currentCommunity.id}_${currentMember.userId}`;
      localStorage.setItem(key, input);
    }
  }, [input, currentCommunity?.id, currentMember?.userId]);

  // Typing indicator
  useEffect(() => {
    if (!currentCommunity?.id || !currentMember?.userId) return;
    if (input.length > 0) {
      setTyping(
        currentMember.userId,
        currentCommunity.id,
        currentMember.userDetails?.name || 'You',
        currentMember.userDetails?.avatar || ''
      );
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        clearTyping(currentMember.userId, currentCommunity.id);
      }, 5000);
    } else {
      clearTyping(currentMember.userId, currentCommunity.id);
    }
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [input, currentCommunity?.id, currentMember?.userId, setTyping, clearTyping]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_MESSAGE_LENGTH) return;
    setInput(e.target.value);
    setError(null);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setError(`Max ${MAX_ATTACHMENTS} attachments allowed.`);
      return;
    }
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${MAX_ATTACHMENT_SIZE_MB}MB.`);
        return;
      }
    }
    setAttachments(prev => [...prev, ...files]);
    setError(null);
  };

  // Remove attachment
  const handleRemoveAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
  };

  // Handle mention select
  const handleMentionSelect = (mention: { id: string; displayName: string; type: MentionType }) => {
    setInput(prev => prev + `@${mention.displayName} `);
    setShowMention(false);
  };

  // Validate message
  const validateMessage = () => {
    if (!input.trim() && attachments.length === 0) {
      setError('Cannot send empty message.');
      return false;
    }
    if (input.length > MAX_MESSAGE_LENGTH) {
      setError('Message too long.');
      return false;
    }
    return true;
  };

  // Handle send
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentCommunity?.id || !currentMember?.userId) return;
    if (!validateMessage()) return;
    setUploading(true);
    setError(null);
    try {
      const chatAttachments = attachments.map(file => ({
        id: generateMessageId(),
        type: AttachmentType.DOCUMENT,
        name: file.name,
        url: '',
        size: file.size,
        mimeType: file.type,
        uploadedBy: currentMember.userId,
        uploadedAt: Timestamp.now(),
        isProcessing: false,
        isScanned: false,
      }));
      const mentions = [];
      const message: ChatMessageCreate = {
        communityId: currentCommunity.id,
        content: input,
        type: MessageType.TEXT,
        authorId: currentMember.userId,
        authorInfo: {
          displayName: currentMember.userDetails.name || 'You',
          photoURL: currentMember.userDetails.avatar || '',
          role:
            currentMember.role === 'admin' ? 'admin' :
            currentMember.role === 'alumni_mentor' ? 'alumni' :
            currentMember.role === 'owner' ? 'admin' :
            currentMember.role === 'moderator' ? 'admin' :
            currentMember.role === 'contributor' ? 'student' :
            currentMember.role === 'member' ? 'student' :
            'student',
          isOnline: currentMember.isOnline,
        },
        threadId: null,
        parentMessageId: null,
        isThreadStarter: false,
        attachments: chatAttachments,
        mentions,
        hasMentions: mentions.length > 0,
        mentionsEveryone: mentions.some((m: { type: MentionType }) => m.type === MentionType.EVERYONE),
        reactionCount: 0,
        bookmarkedBy: [],
        status: MessageStatus.SENDING,
        isEdited: false,
        isDeleted: false,
        isReported: false,
        reportCount: 0,
        isFlagged: false,
        isHidden: false,
        isPinned: false,
        isAnnouncement: false,
        isSystemMessage: false,
        isWelcomeMessage: false,
        searchableContent: input,
        tags: [],
      };
      await sendMessage(message, currentMember.userId);
      setInput('');
      setAttachments([]);
      setDraft('');
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to send message.');
    } finally {
      setUploading(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === '@') {
      setShowMention(true);
    }
    if (e.key === ':' && !showEmoji) {
      setShowEmoji(true);
    }
  };

  // Commonly used emojis
  const commonEmojis = [
    '😀','😁','😂','🤣','😊','😍','😎','😢','😭','😡','😱','👍','🙏','👏','🔥','💯','🎉','🥳','🤔','🙌','😅','😇','😏','😜'
  ];

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSend} className="w-full">
        {/* Main input area */}
        <div className="flex items-end gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500 text-sm leading-5 min-h-[20px] max-h-32"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={uploading || chatLoading}
            rows={1}
            style={{ 
              resize: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}
          />
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              onClick={() => setShowEmoji(!showEmoji)}
              aria-label="Add emoji"
            >
              <span className="text-lg">😊</span>
            </button>
            
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept="*/*"
            />
            <label
              htmlFor="file-upload"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              title="Attach files"
            >
              <span className="text-lg">📎</span>
            </label>

            <button
              type="submit"
              disabled={uploading || chatLoading || (!input.trim() && attachments.length === 0)}
              className={`p-2 rounded-full transition-all ${
                uploading || chatLoading || (!input.trim() && attachments.length === 0)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
              }`}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-lg">➤</span>
              )}
            </button>
          </div>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {attachments.length > 0 && (
              <span>{attachments.length}/{MAX_ATTACHMENTS} files</span>
            )}
          </div>
          <span className={input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-red-500' : ''}>
            {input.length}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>

        {/* Emoji bar */}
        {showEmoji && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-wrap gap-1">
              {commonEmojis.map((emoji, idx) => (
                <button
                  key={emoji + idx}
                  type="button"
                  className="p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                  onClick={() => handleEmojiSelect(emoji)}
                  aria-label={`Add emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">📄</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-blue-900 text-sm truncate">{file.name}</div>
                    <div className="text-blue-600 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveAttachment(idx)}
                  className="p-1 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  aria-label="Remove attachment"
                >
                  ✖️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mention picker */}
        {showMention && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Mention picker functionality</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}