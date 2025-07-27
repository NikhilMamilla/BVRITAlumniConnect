// ===========================
// CHAT.TYPES.TS
// Complete Real-time Chat System Types
// ===========================

import { Timestamp } from 'firebase/firestore';

// ===========================
// ENUMS & CONSTANTS
// ===========================

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  LINK = 'link',
  CODE = 'code',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
  POLL = 'poll',
  EVENT_REMINDER = 'event_reminder',
  WELCOME = 'welcome'
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
  EDITED = 'edited'
}

export enum ReactionType {
  THUMBS_UP = '👍',
  HEART = '❤️',
  LAUGH = '😂',
  WOW = '😮',
  SAD = '😢',
  ANGRY = '😠',
  CELEBRATE = '🎉',
  FIRE = '🔥',
  CLAP = '👏',
  THINKING = '🤔'
}

export enum ThreadType {
  REPLY = 'reply',
  DISCUSSION = 'discussion',
  QUESTION = 'question'
}

export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE_SNIPPET = 'code_snippet',
  LINK_PREVIEW = 'link_preview'
}

export enum MentionType {
  USER = 'user',
  EVERYONE = 'everyone',
  MODERATORS = 'moderators',
  ALUMNI = 'alumni',
  ROLE = 'role'
}

// ===========================
// CORE CHAT INTERFACES
// ===========================

export interface ChatMessage {
  id: string;
  communityId: string;
  
  // Content
  content: string;
  type: MessageType;
  htmlContent?: string; // For rich text formatting
  rawContent?: string;  // Original markdown/raw content
  
  // Author Information
  authorId: string;
  authorInfo: {
    displayName: string;
    photoURL?: string;
    role: 'student' | 'alumni' | 'admin';
    badge?: string;
    isOnline: boolean;
  };
  
  // Threading & Replies
  threadId?: string;
  parentMessageId?: string;
  replyCount: number;
  isThreadStarter: boolean;
  
  // Attachments & Media
  attachments: ChatAttachment[];
  linkPreview?: LinkPreview;
  codeSnippet?: CodeSnippet;
  poll?: MessagePoll;
  
  // Mentions & References
  mentions: MessageMention[];
  hasMentions: boolean;
  mentionsEveryone: boolean;
  
  // Reactions & Engagement
  reactions: MessageReaction[];
  reactionCount: number;
  bookmarkedBy: string[]; // User IDs who bookmarked
  
  // Status & Metadata
  status: MessageStatus;
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  isFlagged: boolean;
  flaggedReason?: string;
  isHidden: boolean;
  hiddenBy?: string;
  hiddenReason?: string;
  
  // Special Flags
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Timestamp;
  isAnnouncement: boolean;
  isSystemMessage: boolean;
  isWelcomeMessage: boolean;
  
  // Search & Indexing
  searchableContent: string; // Processed content for search
  tags: string[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Real-time Indicators
  readBy: Record<string, Timestamp>; // userId -> timestamp when read
  deliveredTo: string[]; // User IDs who received the message
  
  // Client-side temporary fields
  isOptimistic?: boolean; // For optimistic updates
  localId?: string; // Temporary ID before server confirms
  uploadProgress?: number; // For file uploads
}

export interface ChatAttachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  
  // Image/Video specific
  width?: number;
  height?: number;
  duration?: number; // For video/audio in seconds
  
  // Document specific
  pageCount?: number;
  
  // Upload metadata
  uploadedBy: string;
  uploadedAt: Timestamp;
  isProcessing: boolean;
  processingError?: string;
  
  // Security
  isScanned: boolean;
  scanResult?: 'clean' | 'malware' | 'suspicious';
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  favicon?: string;
  isInternal: boolean; // If it's a link to another part of the platform
  
  // Metadata
  generatedAt: Timestamp;
  isValid: boolean;
  error?: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
  highlightedLines?: number[];
  theme: 'light' | 'dark';
  isExecutable: boolean;
  
  // Metadata
  lineCount: number;
  characterCount: number;
}

export interface MessagePoll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleAnswers: boolean;
  isAnonymous: boolean;
  expiresAt?: Timestamp;
  isExpired: boolean;
  totalVotes: number;
  
  // Results
  results: Record<string, number>; // optionId -> vote count
  voterIds: string[]; // For non-anonymous polls
  
  createdBy: string;
  createdAt: Timestamp;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface MessageMention {
  id: string;
  type: MentionType;
  userId?: string; // For user mentions
  roleType?: string; // For role mentions
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export interface MessageReaction {
  id: string;
  type: ReactionType;
  emoji: string;
  userId: string;
  userInfo: {
    displayName: string;
    photoURL?: string;
  };
  createdAt: Timestamp;
}

// ===========================
// CHAT ROOM & THREAD INTERFACES
// ===========================

export interface ChatRoom {
  id: string; // Same as community ID
  communityId: string;
  
  // Basic Info
  name: string;
  description?: string;
  
  // Message Statistics
  totalMessages: number;
  messagesLast24h: number;
  messagesLastWeek: number;
  lastMessageAt?: Timestamp;
  lastMessagePreview?: string;
  lastMessageAuthor?: string;
  
  // Active Users
  activeUsers: ActiveUser[];
  typingUsers: TypingUser[];
  onlineCount: number;
  
  // Settings
  settings: ChatRoomSettings;
  
  // Moderation
  moderationSettings: ChatModerationSettings;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatThread {
  id: string;
  messageId: string; // Parent message ID
  communityId: string;
  
  // Thread Info
  title?: string;
  type: ThreadType;
  
  // Statistics
  replyCount: number;
  participantCount: number;
  participantIds: string[];
  
  // Activity
  lastReplyAt?: Timestamp;
  lastReplyBy?: string;
  isActive: boolean;
  
  // Thread starter info
  starterUserId: string;
  starterInfo: {
    displayName: string;
    photoURL?: string;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveUser {
  userId: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'alumni' | 'admin';
  lastSeen: Timestamp;
  isTyping: boolean;
}

export interface TypingUser {
  userId: string;
  displayName: string;
  startedTypingAt: Timestamp;
}

export interface ChatRoomSettings {
  // Message Features
  allowFileUploads: boolean;
  allowImageUploads: boolean;
  allowLinkPreviews: boolean;
  allowReactions: boolean;
  allowThreads: boolean;
  allowPolls: boolean;
  allowCodeSnippets: boolean;
  
  // Moderation
  requireApprovalForFiles: boolean;
  autoDeleteAfterDays?: number;
  maxMessageLength: number;
  maxAttachmentSize: number; // in MB
  
  // Permissions
  whoCanPin: 'moderators' | 'alumni' | 'everyone';
  whoCanDeleteMessages: 'author_and_moderators' | 'moderators' | 'author_only';
  whoCanMention: 'everyone' | 'members' | 'moderators';
  
  // Notifications
  mentionNotifications: boolean;
  keywordNotifications: string[];
  
  // Rate Limiting
  messagesPerMinute: number;
  slowModeInterval?: number; // seconds between messages
}

export interface ChatModerationSettings {
  // Auto Moderation
  enableAutoModeration: boolean;
  profanityFilter: boolean;
  spamDetection: boolean;
  linkFilter: boolean;
  
  // Keyword Filtering
  blockedWords: string[];
  flaggedWords: string[];
  
  // User Restrictions
  newUserRestrictions: boolean;
  newUserPeriodHours: number;
  
  // Reporting
  enableReporting: boolean;
  autoActionThreshold: number; // Number of reports before auto-action
}

// ===========================
// REAL-TIME & PRESENCE INTERFACES
// ===========================

export interface UserPresence {
  userId: string;
  communityId: string;
  
  // Status
  isOnline: boolean;
  lastSeen: Timestamp;
  status: 'online' | 'away' | 'busy' | 'offline';
  
  // Activity
  isTyping: boolean;
  typingStartedAt?: Timestamp;
  currentChannel?: string;
  
  // Device Info
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent?: string;
  
  // Session
  sessionId: string;
  connectedAt: Timestamp;
}

export interface TypingIndicator {
  userId: string;
  communityId: string;
  displayName: string;
  photoURL?: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
}

export interface ChatNotification {
  id: string;
  userId: string;
  communityId: string;
  messageId: string;
  
  // Notification Details
  type: 'mention' | 'reply' | 'reaction' | 'announcement' | 'direct_message';
  title: string;
  body: string;
  
  // Message Context
  authorName: string;
  authorPhoto?: string;
  messagePreview: string;
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // Actions
  actionUrl?: string;
  actions?: NotificationAction[];
  
  createdAt: Timestamp;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: 'mark_read' | 'reply' | 'react' | 'view' | 'dismiss';
  url?: string;
}

// ===========================
// SEARCH & FILTERING INTERFACES
// ===========================

export interface ChatSearchParams {
  query: string;
  communityId?: string;
  authorId?: string;
  messageType?: MessageType;
  hasAttachments?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy: 'relevance' | 'date' | 'reactions';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface ChatSearchResult {
  message: ChatMessage;
  relevanceScore: number;
  highlightedContent: string;
  context: {
    previousMessage?: ChatMessage;
    nextMessage?: ChatMessage;
  };
}

export interface ChatFilter {
  id: string;
  name: string;
  userId: string;
  communityId: string;
  
  // Filter Criteria
  authors: string[];
  messageTypes: MessageType[];
  keywords: string[];
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // Settings
  isDefault: boolean;
  isShared: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===========================
// ANALYTICS & METRICS INTERFACES
// ===========================

export interface ChatAnalytics {
  communityId: string;
  date: string; // YYYY-MM-DD format
  
  // Message Metrics
  totalMessages: number;
  uniqueUsers: number;
  averageMessageLength: number;
  
  // Engagement Metrics
  totalReactions: number;
  totalReplies: number;
  totalMentions: number;
  
  // Content Distribution
  messagesByType: Record<MessageType, number>;
  attachmentCount: number;
  linkCount: number;
  codeSnippetCount: number;
  
  // User Activity
  mostActiveUsers: {
    userId: string;
    displayName: string;
    messageCount: number;
  }[];
  
  // Time Distribution
  messagesByHour: Record<string, number>; // hour -> count
  peakActivityHour: number;
  
  // Popular Content
  mostReactedMessages: string[]; // Message IDs
  mostRepliedMessages: string[]; // Message IDs
  
  generatedAt: Timestamp;
}

// ===========================
// ERROR & VALIDATION INTERFACES
// ===========================

export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
  userId?: string;
  communityId?: string;
  messageId?: string;
}

export interface MessageValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ===========================
// UTILITY TYPES
// ===========================

export type ChatMessageCreate = Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt' | 'reactions' | 'replyCount' | 'readBy' | 'deliveredTo'>;

export type ChatMessageUpdate = Partial<Pick<ChatMessage, 'content' | 'htmlContent' | 'attachments' | 'tags' | 'isPinned'>>;

export type MessageReactionCreate = Omit<MessageReaction, 'id' | 'createdAt'>;

export type ChatSearchFilters = Partial<ChatSearchParams>;

// Real-time subscription types
export type ChatSubscriptionType = 'messages' | 'reactions' | 'typing' | 'presence' | 'threads';

export interface ChatSubscription {
  type: ChatSubscriptionType;
  communityId: string;
  callback: (data: unknown) => void;
  filters?: Record<string, unknown>;
}

// Pagination for chat messages
export interface ChatMessageCursor {
  messageId: string;
  timestamp: Timestamp;
  direction: 'before' | 'after';
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: ChatMessageCursor;
  previousCursor?: ChatMessageCursor;
  total: number;
}