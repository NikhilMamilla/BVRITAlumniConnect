import React from 'react';
import type { ChatMessage } from '../../types/chat.types';
import { formatRelativeTime } from '../../utils/dateHelpers';
import { isPinned, isEdited, isDeleted, isBookmarked } from '../../utils/chatHelpers';
import { useCommunityContext } from '../../contexts/CommunityContext';
import { useChatContext } from '../../contexts/ChatContext';
import { chatConfig } from '../../config/chatConfig';
import { MessageType, ReactionType } from '../../types/chat.types';

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentUserId }) => {
  const { currentCommunity, currentMember } = useCommunityContext();
  const { addReaction, removeReaction, pinMessage, unpinMessage, bookmarkMessage, unbookmarkMessage, deleteMessage, editMessage, reportMessage, hideMessage } = useChatContext();

  // Status flags
  const isMine = currentUserId && message.authorId === currentUserId;
  const canEdit = isMine && !message.isDeleted && !message.isSystemMessage && !message.isAnnouncement;
  const canDelete = (currentMember?.role === 'admin' || currentMember?.role === 'moderator' || isMine) && !message.isDeleted;
  const canPin = currentMember?.role === 'admin' || currentMember?.role === 'moderator';
  const canBookmark = !!currentUserId;
  const canReact = !message.isDeleted && !message.isSystemMessage && !message.isAnnouncement;
  const canReport = !!currentUserId && !isMine && !message.isDeleted;

  // Handlers
  const handleReaction = (emoji: string) => {
    if (!currentUserId || !canReact) return;
    const existing = message.reactions.find(r => r.userId === currentUserId && r.emoji === emoji);
    if (existing) {
      removeReaction(message.id, existing.id);
    } else {
      addReaction(message.id, {
        type: ReactionType.THUMBS_UP,
        emoji,
        userId: currentUserId,
        userInfo: {
          displayName: currentMember?.userDetails?.name || '',
          photoURL: currentMember?.userDetails?.avatar,
        },
      });
    }
  };

  const handlePin = () => {
    if (isPinned(message)) {
      unpinMessage(message.id, currentUserId!);
    } else {
      pinMessage(message.id, currentUserId!);
    }
  };

  const handleBookmark = () => {
    if (isBookmarked(message, currentUserId!)) {
      unbookmarkMessage(message.id, currentUserId!);
    } else {
      bookmarkMessage(message.id, currentUserId!);
    }
  };

  const handleDelete = () => {
    deleteMessage(message.id, currentUserId!);
  };

  const handleEdit = () => {
    // Open edit UI/modal (implementation not shown)
  };

  const handleReport = () => {
    reportMessage(message.id, currentUserId!, 'Inappropriate content');
  };

  const handleHide = () => {
    hideMessage(message.id, currentUserId!, 'Hidden by moderator');
  };

  // Render author info
  const renderAuthor = () => (
    <div className="flex items-center gap-3 mb-2">
      {message.authorInfo.photoURL ? (
        <img 
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" 
          src={message.authorInfo.photoURL} 
          alt={message.authorInfo.displayName} 
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {message.authorInfo.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`font-semibold text-sm ${
          message.authorInfo.role === 'admin' ? 'text-red-600' : 
          message.authorInfo.role === 'alumni' ? 'text-purple-600' : 
          'text-gray-900'
        }`}>
          {message.authorInfo.displayName}
        </span>
        {message.authorInfo.badge && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {message.authorInfo.badge}
          </span>
        )}
        {message.authorInfo.isOnline && (
          <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
        )}
      </div>
    </div>
  );

  // Render content
  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <div className="text-gray-500 italic text-sm bg-gray-50 rounded-lg p-3">
          <span>This message was deleted</span>
        </div>
      );
    }

    if (message.type === MessageType.CODE && message.codeSnippet) {
      return (
        <div className="bg-gray-900 rounded-lg overflow-hidden my-2">
          <div className="bg-gray-800 px-4 py-2 text-gray-300 text-xs font-medium">
            Code
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            <code>{message.codeSnippet.code}</code>
          </pre>
        </div>
      );
    }

    if (message.type === MessageType.POLL && message.poll) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
          <div className="font-semibold text-blue-900 mb-3">📊 {message.poll.question}</div>
          <div className="text-sm text-blue-700">Poll options would appear here</div>
        </div>
      );
    }

    if (message.type === MessageType.LINK && message.linkPreview) {
      return (
        <div className="border border-gray-200 rounded-lg overflow-hidden my-2 hover:shadow-sm transition-shadow">
          <a 
            href={message.linkPreview.url} 
            className="block p-4 hover:bg-gray-50 transition-colors" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <div className="text-blue-600 font-medium text-sm">
              🔗 {message.linkPreview.title || message.linkPreview.url}
            </div>
          </a>
        </div>
      );
    }

    // Default: rich text or plain text
    return (
      <div 
        className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words" 
        dangerouslySetInnerHTML={{ __html: message.htmlContent || message.content }} 
      />
    );
  };

  // Render attachments
  const renderAttachments = () => (
    message.attachments && message.attachments.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-3">
        {message.attachments.map(att => (
          <a 
            key={att.id} 
            href={att.url} 
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm transition-colors" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <div className="text-blue-600">📎</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{att.name}</div>
              <div className="text-gray-500 text-xs">{(att.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </a>
        ))}
      </div>
    )
  );

  // Render mentions
  const renderMentions = () => (
    message.mentions && message.mentions.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {message.mentions.map(m => (
          <span 
            key={m.id} 
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              m.type === 'everyone' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            @{m.displayName}
          </span>
        ))}
      </div>
    )
  );

  // Render reactions
  const renderReactions = () => (
    message.reactions && message.reactions.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-3">
        {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
          const count = message.reactions.filter(r => r.emoji === emoji).length;
          const hasUserReacted = message.reactions.some(r => r.emoji === emoji && r.userId === currentUserId);
          
          return (
            <button 
              key={emoji}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-colors ${
                hasUserReacted 
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleReaction(emoji)} 
              title={`React with ${emoji}`}
              aria-label={`React with ${emoji}`}
            >
              <span>{emoji}</span>
              <span className="text-xs">{count}</span>
            </button>
          );
        })}
      </div>
    )
  );

  // Render status indicators
  const renderStatus = () => (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
      {isPinned(message) && <span className="text-yellow-600" title="Pinned">📌</span>}
      {isEdited(message) && <span className="text-gray-400">(edited)</span>}
      {isBookmarked(message, currentUserId || '') && <span className="text-yellow-600" title="Bookmarked">⭐</span>}
      {message.isAnnouncement && <span className="text-blue-600 font-medium">[Announcement]</span>}
      {message.isSystemMessage && <span className="text-gray-600">[System]</span>}
      {message.isWelcomeMessage && <span className="text-green-600">[Welcome]</span>}
      {message.isReported && <span className="text-red-600">[Reported]</span>}
      {message.isFlagged && <span className="text-orange-600">[Flagged]</span>}
      {message.isHidden && <span className="text-gray-600">[Hidden]</span>}
    </div>
  );

  // Render actions
  const renderActions = () => (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {canEdit && (
        <button 
          onClick={handleEdit} 
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit"
        >
          ✏️
        </button>
      )}
      {canDelete && (
        <button 
          onClick={handleDelete} 
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          🗑️
        </button>
      )}
      {canPin && (
        <button 
          onClick={handlePin} 
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
          title={isPinned(message) ? 'Unpin' : 'Pin'}
        >
          {isPinned(message) ? '📌' : '📍'}
        </button>
      )}
      {canBookmark && (
        <button 
          onClick={handleBookmark} 
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
          title={isBookmarked(message, currentUserId || '') ? 'Remove bookmark' : 'Bookmark'}
        >
          {isBookmarked(message, currentUserId || '') ? '⭐' : '☆'}
        </button>
      )}
      {canReport && (
        <button 
          onClick={handleReport} 
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Report"
        >
          🚩
        </button>
      )}
      {currentMember?.role === 'moderator' && (
        <button 
          onClick={handleHide} 
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title="Hide"
        >
          🙈
        </button>
      )}
    </div>
  );

  // Render timestamp
  const renderTimestamp = () => {
    if (!message.createdAt || typeof message.createdAt.toDate !== 'function') {
      return <span className="text-xs text-gray-400">...</span>;
    }
    return (
      <span 
        className="text-xs text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
        title={message.createdAt.toDate().toLocaleString()}
      >
        {formatRelativeTime(message.createdAt.toDate())}
      </span>
    );
  };

  return (
    <div 
      className={`group p-4 hover:bg-gray-50 transition-colors border-l-2 ${
        isPinned(message) ? 'border-l-yellow-400 bg-yellow-50' : 
        isDeleted(message) ? 'border-l-red-300 bg-red-50' : 
        message.isSystemMessage ? 'border-l-blue-400 bg-blue-50' : 
        message.isAnnouncement ? 'border-l-purple-400 bg-purple-50' : 
        message.isWelcomeMessage ? 'border-l-green-400 bg-green-50' : 
        'border-l-transparent'
      }`}
      aria-live="polite"
      tabIndex={0}
      data-message-id={message.id}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {renderAuthor()}
          <div className="ml-13">
            {renderStatus()}
            <div className="mb-2">
              {renderContent()}
            </div>
            {renderMentions()}
            {renderAttachments()}
            {renderReactions()}
            {renderActions()}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {renderTimestamp()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;