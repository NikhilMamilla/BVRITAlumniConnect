import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  ChatMessage,
  ChatMessageCreate,
  ChatMessageUpdate,
  MessageReaction,
  MessageReactionCreate,
  ChatAttachment,
  TypingIndicator,
  UserPresence,
  ChatSearchParams,
  ChatSearchResult,
  ChatMessagePage,
  ReactionType,
  MessageStatus,
  MessageType,
  ChatSubscriptionType
} from '../types/chat.types';
import type { PaginationParams } from '../types/common.types';

export class ChatService {
  private static instance: ChatService;
  private readonly CHAT_MESSAGES_COLLECTION = 'chatMessages';
  private readonly TYPING_INDICATORS_COLLECTION = 'typingIndicators';
  private readonly ONLINE_PRESENCE_COLLECTION = 'onlinePresence';
  private activeListeners: Map<string, Unsubscribe> = new Map();

  private constructor() {}
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Send a new chat message (with attachments, mentions, etc.)
   */
  async sendMessage(
    communityId: string,
    message: ChatMessageCreate,
    authorId: string
  ): Promise<string> {
    try {
      const messagesRef = collection(db, this.CHAT_MESSAGES_COLLECTION);
      const now = serverTimestamp();
      const docRef = doc(messagesRef);
      const messageData = {
        ...message,
        communityId,
        authorId,
        createdAt: now,
        updatedAt: now,
        status: 'sent',
        isEdited: false,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        replyCount: 0,
        reactionCount: 0,
        reactions: [],
        readBy: {},
        deliveredTo: [],
        isPinned: false,
        isAnnouncement: false,
        isSystemMessage: false,
        isWelcomeMessage: false,
        isReported: false,
        reportCount: 0,
        isFlagged: false,
        isHidden: false,
        hasMentions: message.mentions && message.mentions.length > 0,
        mentionsEveryone: message.mentions && message.mentions.some(m => m.type === 'everyone'),
        searchableContent: message.content,
        tags: message.tags || []
      };
      await setDoc(docRef, messageData);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Edit a chat message (author within 15 min or moderator)
   */
  async editMessage(
    messageId: string,
    updates: ChatMessageUpdate,
    editorId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      // Only author within 15 min or moderator can edit
      const now = Timestamp.now();
      const canEdit = (data.authorId === editorId &&
        now.toMillis() - data.createdAt.toMillis() <= 15 * 60 * 1000) ||
        this.isModerator(data.communityId, editorId);
      if (!canEdit) throw new Error('Not authorized to edit this message');
      await updateDoc(messageRef, {
        ...updates,
        isEdited: true,
        editedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  }

  /**
   * Delete a chat message (moderator only)
   */
  async deleteMessage(
    messageId: string,
    deleterId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      if (!this.isModerator(data.communityId, deleterId)) throw new Error('Not authorized to delete');
      await updateDoc(messageRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: deleterId,
        status: 'deleted',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as ChatMessage;
    } catch (error) {
      console.error('Error getting message:', error);
      throw new Error('Failed to get message');
    }
  }

  /**
   * List messages for a community (with filters, pagination, and sorting)
   */
  async listMessages(
    communityId: string,
    filters: Partial<ChatSearchParams> = {},
    pagination: PaginationParams = { limit: 20 },
    sortOptions?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<ChatMessagePage> {
    try {
      let q = query(collection(db, this.CHAT_MESSAGES_COLLECTION), where('communityId', '==', communityId));
      if (filters.authorId) {
        q = query(q, where('authorId', '==', filters.authorId));
      }
      if (filters.messageType) {
        q = query(q, where('type', '==', filters.messageType));
      }
      if (filters.hasAttachments) {
        q = query(q, where('attachments', '!=', []));
      }
      if (filters.tags && filters.tags.length > 0) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }
      if (sortOptions) {
        q = query(q, orderBy(sortOptions.field, sortOptions.direction));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }
      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }
      q = query(q, limit(pagination.limit + 1));
      const snapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      snapshot.docs.forEach((doc, idx) => {
        if (idx < pagination.limit) {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        }
      });
      return {
        messages,
        hasMore: snapshot.docs.length > pagination.limit,
        nextCursor: snapshot.docs.length > pagination.limit ? {
          messageId: snapshot.docs[pagination.limit].id,
          timestamp: snapshot.docs[pagination.limit].data().createdAt,
          direction: 'after'
        } : undefined,
        previousCursor: undefined,
        total: messages.length
      };
    } catch (error) {
      console.error('Error listing messages:', error);
      throw new Error('Failed to list messages');
    }
  }

  /**
   * Real-time subscribe to messages in a community (with filters)
   */
  subscribeToMessages(
    communityId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: FirestoreError) => void,
    filters: Partial<ChatSearchParams> = {},
    sortOptions?: { field: string; direction: 'asc' | 'desc' }
  ): Unsubscribe {
    let q = query(collection(db, this.CHAT_MESSAGES_COLLECTION), where('communityId', '==', communityId));
    if (filters.authorId) {
      q = query(q, where('authorId', '==', filters.authorId));
    }
    if (filters.messageType) {
      q = query(q, where('type', '==', filters.messageType));
    }
    if (filters.hasAttachments) {
      q = query(q, where('attachments', '!=', []));
    }
    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }
    if (sortOptions) {
      q = query(q, orderBy(sortOptions.field, sortOptions.direction));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach(doc => {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages);
      },
      onError
    );
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(
    messageId: string,
    reaction: MessageReactionCreate
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        reactions: arrayUnion(reaction),
        reactionCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(
    messageId: string,
    reactionId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      const updatedReactions = data.reactions.filter(r => r.id !== reactionId);
      await updateDoc(messageRef, {
        reactions: updatedReactions,
        reactionCount: updatedReactions.length,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  /**
   * Set typing indicator for a user
   */
  async setTypingIndicator(
    communityId: string,
    userId: string,
    displayName: string,
    photoURL?: string
  ): Promise<void> {
    try {
      const indicatorId = `${userId}_${communityId}`;
      const indicatorRef = doc(db, this.TYPING_INDICATORS_COLLECTION, indicatorId);
      await setDoc(indicatorRef, {
        userId,
        communityId,
        displayName,
        photoURL,
        startedAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 10000) // 10s expiry
      });
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw new Error('Failed to set typing indicator');
    }
  }

  /**
   * Clear typing indicator for a user
   */
  async clearTypingIndicator(
    communityId: string,
    userId: string
  ): Promise<void> {
    try {
      const indicatorId = `${userId}_${communityId}`;
      const indicatorRef = doc(db, this.TYPING_INDICATORS_COLLECTION, indicatorId);
      await deleteDoc(indicatorRef);
    } catch (error) {
      console.error('Error clearing typing indicator:', error);
      throw new Error('Failed to clear typing indicator');
    }
  }

  /**
   * Subscribe to typing indicators in a community
   */
  subscribeToTypingIndicators(
    communityId: string,
    callback: (indicators: TypingIndicator[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.TYPING_INDICATORS_COLLECTION), where('communityId', '==', communityId));
    return onSnapshot(
      q,
      (snapshot) => {
        const indicators: TypingIndicator[] = [];
        snapshot.forEach(doc => {
          indicators.push(doc.data() as TypingIndicator);
        });
        callback(indicators);
      },
      onError
    );
  }

  /**
   * Set user online presence
   */
  async setUserPresence(
    communityId: string,
    userId: string,
    status: 'online' | 'away' | 'busy' | 'offline',
    deviceType: 'desktop' | 'mobile' | 'tablet',
    userAgent?: string
  ): Promise<void> {
    try {
      const presenceId = `${userId}_${communityId}`;
      const presenceRef = doc(db, this.ONLINE_PRESENCE_COLLECTION, presenceId);
      await setDoc(presenceRef, {
        userId,
        communityId,
        status,
        isOnline: status === 'online',
        lastSeen: serverTimestamp(),
        deviceType,
        userAgent,
        sessionId: presenceId,
        connectedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting user presence:', error);
      throw new Error('Failed to set user presence');
    }
  }

  /**
   * Clear user online presence
   */
  async clearUserPresence(
    communityId: string,
    userId: string
  ): Promise<void> {
    try {
      const presenceId = `${userId}_${communityId}`;
      const presenceRef = doc(db, this.ONLINE_PRESENCE_COLLECTION, presenceId);
      await deleteDoc(presenceRef);
    } catch (error) {
      console.error('Error clearing user presence:', error);
      throw new Error('Failed to clear user presence');
    }
  }

  /**
   * Subscribe to online presence in a community
   */
  subscribeToPresence(
    communityId: string,
    callback: (presences: UserPresence[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.ONLINE_PRESENCE_COLLECTION), where('communityId', '==', communityId));
    return onSnapshot(
      q,
      (snapshot) => {
        const presences: UserPresence[] = [];
        snapshot.forEach(doc => {
          presences.push(doc.data() as UserPresence);
        });
        callback(presences);
      },
      onError
    );
  }

  /**
   * Pin a message (moderator only)
   */
  async pinMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      if (!this.isModerator(data.communityId, userId)) throw new Error('Not authorized to pin');
      await updateDoc(messageRef, {
        isPinned: true,
        pinnedBy: userId,
        pinnedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error pinning message:', error);
      throw new Error('Failed to pin message');
    }
  }

  /**
   * Unpin a message (moderator only)
   */
  async unpinMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      if (!this.isModerator(data.communityId, userId)) throw new Error('Not authorized to unpin');
      await updateDoc(messageRef, {
        isPinned: false,
        pinnedBy: null,
        pinnedAt: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error unpinning message:', error);
      throw new Error('Failed to unpin message');
    }
  }

  /**
   * Bookmark a message (user only)
   */
  async bookmarkMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        bookmarkedBy: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error bookmarking message:', error);
      throw new Error('Failed to bookmark message');
    }
  }

  /**
   * Remove bookmark from a message (user only)
   */
  async unbookmarkMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        bookmarkedBy: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error unbookmarking message:', error);
      throw new Error('Failed to unbookmark message');
    }
  }

  /**
   * Report a message (user only)
   */
  async reportMessage(
    messageId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      await updateDoc(messageRef, {
        isReported: true,
        reportCount: increment(1),
        flaggedReason: reason,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error reporting message:', error);
      throw new Error('Failed to report message');
    }
  }

  /**
   * Hide a message (moderator only)
   */
  async hideMessage(
    messageId: string,
    moderatorId: string,
    reason: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.CHAT_MESSAGES_COLLECTION, messageId);
      const snapshot = await getDoc(messageRef);
      if (!snapshot.exists()) throw new Error('Message not found');
      const data = snapshot.data() as ChatMessage;
      if (!this.isModerator(data.communityId, moderatorId)) throw new Error('Not authorized to hide');
      await updateDoc(messageRef, {
        isHidden: true,
        hiddenBy: moderatorId,
        hiddenReason: reason,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error hiding message:', error);
      throw new Error('Failed to hide message');
    }
  }

  /**
   * Utility: Check if user is a moderator (stub, replace with real logic)
   */
  private isModerator(communityId: string, userId: string): boolean {
    // TODO: Replace with actual check (e.g., query memberService or cache)
    // For now, always return false (must be implemented)
    return false;
  }
}
