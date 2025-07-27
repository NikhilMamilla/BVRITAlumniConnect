// chatHelpers.ts
// Advanced, Firestore-compliant chat helpers for the community platform

import type { ChatMessage, MessageReaction, TypingIndicator, UserPresence } from '../types/chat.types';

// Check if a message is pinned
export function isPinned(message: ChatMessage): boolean {
  return !!message.pinnedAt;
}

// Check if a message is bookmarked by a user
export function isBookmarked(message: ChatMessage, userId: string): boolean {
  return Array.isArray(message.bookmarkedBy) && message.bookmarkedBy.includes(userId);
}

// Check if a message is edited
export function isEdited(message: ChatMessage): boolean {
  return !!message.editedAt;
}

// Check if a message is deleted
export function isDeleted(message: ChatMessage): boolean {
  return !!message.deletedAt;
}

// Format a message for display/logs
export function formatMessage(message: ChatMessage): string {
  return `${message.authorInfo.displayName}: ${message.content}`;
}

// Add a reaction to a message
export function addReaction(
  reactions: MessageReaction[],
  reaction: MessageReaction
): MessageReaction[] {
  return [...reactions, reaction];
}

// Remove a reaction from a message
export function removeReaction(
  reactions: MessageReaction[],
  reactionId: string
): MessageReaction[] {
  return reactions.filter(r => r.id !== reactionId);
}

// Check if a user has reacted with a specific emoji
export function hasReaction(
  reactions: MessageReaction[],
  userId: string,
  emoji: string
): boolean {
  return reactions.some(r => r.userId === userId && r.emoji === emoji);
}

// Check if a user is currently typing
export function isUserTyping(
  presenceList: UserPresence[],
  userId: string
): boolean {
  return presenceList.some(p => p.userId === userId && p.isTyping);
}

// Check if a user is present in chat
export function isUserPresent(
  presenceList: UserPresence[],
  userId: string
): boolean {
  return presenceList.some(p => p.userId === userId && p.status === 'online');
}

// Generate a message ID (e.g., for optimistic UI)
export function generateMessageId(): string {
  return 'msg_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Validate a message ID
export function validateMessageId(id: string): boolean {
  return /^msg_[a-z0-9]+_\d+$/.test(id);
} 