import { Timestamp } from 'firebase/firestore';
import { REGEX, COLLECTIONS } from './constants';
import type { Community } from '../types/community.types';
import type { ChatMessage, LinkPreview as ChatLinkPreview } from '../types/chat.types';
import type { Resource, LinkPreview as ResourceLinkPreview } from '../types/resource.types';

// ==================== SLUG HELPERS ====================

/**
 * Generate a URL-friendly slug from a string (matches Firestore index logic)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50);
}

/**
 * Validate a slug (must match Firestore index and rules)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,50}$/.test(slug);
}

// ==================== URL VALIDATION & DETECTION ====================

/**
 * Validate a URL using project regex
 */
export function isValidUrl(url: string): boolean {
  return REGEX.URL.test(url);
}

/**
 * Check if a URL is internal (platform-specific)
 */
export function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.hostname === window.location.hostname;
  } catch {
    return false;
  }
}

/**
 * Check if a URL is external
 */
export function isExternalUrl(url: string): boolean {
  return !isInternalUrl(url);
}

// ==================== COMMUNITY URL HELPERS ====================

/**
 * Build a community URL from a Community object or slug
 */
export function getCommunityUrl(community: Pick<Community, 'slug'> | string): string {
  const slug = typeof community === 'string' ? community : community.slug;
  return `/community/${encodeURIComponent(slug)}`;
}

/**
 * Parse a community slug from a URL
 */
export function parseCommunitySlug(url: string): string | null {
  const match = url.match(/\/community\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

// ==================== RESOURCE & FILE URL HELPERS ====================

/**
 * Build a resource URL from a Resource object or ID
 */
export function getResourceUrl(resource: Pick<Resource, 'id' | 'communityId'> | string, communityId?: string): string {
  if (typeof resource === 'string') {
    if (!communityId) throw new Error('communityId required when passing resourceId');
    return `/community/${encodeURIComponent(communityId)}/resources/${encodeURIComponent(resource)}`;
  }
  return `/community/${encodeURIComponent(resource.communityId)}/resources/${encodeURIComponent(resource.id)}`;
}

/**
 * Parse resource ID and communityId from a resource URL
 */
export function parseResourceUrl(url: string): { communityId: string; resourceId: string } | null {
  const match = url.match(/\/community\/([a-z0-9-]+)\/resources\/([a-zA-Z0-9-]+)/i);
  return match ? { communityId: match[1], resourceId: match[2] } : null;
}

/**
 * Build a file URL for a resource or chat attachment (Firestore-compliant)
 */
export function getFileUrl(file: { id: string; communityId: string }): string {
  return `/community/${encodeURIComponent(file.communityId)}/files/${encodeURIComponent(file.id)}`;
}

/**
 * Parse fileId and communityId from a file URL
 */
export function parseFileUrl(url: string): { communityId: string; fileId: string } | null {
  const match = url.match(/\/community\/([a-z0-9-]+)\/files\/([a-zA-Z0-9-]+)/i);
  return match ? { communityId: match[1], fileId: match[2] } : null;
}

// ==================== CHAT & DISCUSSION URL HELPERS ====================

/**
 * Build a chat message URL
 */
export function getChatMessageUrl(message: Pick<ChatMessage, 'communityId' | 'id'>): string {
  return `/community/${encodeURIComponent(message.communityId)}/chat/${encodeURIComponent(message.id)}`;
}

/**
 * Parse chat message ID and communityId from a chat URL
 */
export function parseChatMessageUrl(url: string): { communityId: string; messageId: string } | null {
  const match = url.match(/\/community\/([a-z0-9-]+)\/chat\/([a-zA-Z0-9-]+)/i);
  return match ? { communityId: match[1], messageId: match[2] } : null;
}

// ==================== USER & PROFILE URL HELPERS ====================

/**
 * Build a user profile URL
 */
export function getUserProfileUrl(userId: string): string {
  return `/profile/${encodeURIComponent(userId)}`;
}

/**
 * Parse userId from a profile URL
 */
export function parseUserProfileUrl(url: string): string | null {
  const match = url.match(/\/profile\/([a-zA-Z0-9-]+)/i);
  return match ? match[1] : null;
}

// ==================== LINK PREVIEW HELPERS ====================

/**
 * Build a type-safe link preview for chat or resource
 */
export function buildLinkPreview(url: string, meta?: Partial<ChatLinkPreview | ResourceLinkPreview>): ChatLinkPreview {
  return {
    url,
    title: meta?.title,
    description: meta?.description,
    imageUrl: (meta as ChatLinkPreview)?.imageUrl || (meta as ResourceLinkPreview)?.image,
    siteName: meta?.siteName,
    favicon: meta?.favicon,
    isInternal: isInternalUrl(url),
    generatedAt: Timestamp.now(),
    isValid: isValidUrl(url),
    error: undefined,
  };
}

// ==================== FIRESTORE INDEX/RULE HELPERS ====================

/**
 * Get Firestore collection path for a community
 */
export function getCommunityCollectionPath(communityId: string): string {
  return `${COLLECTIONS.COMMUNITIES}/${communityId}`;
}

/**
 * Get Firestore collection path for resources in a community
 */
export function getResourceCollectionPath(communityId: string): string {
  return `${COLLECTIONS.COMMUNITIES}/${communityId}/${COLLECTIONS.RESOURCES}`;
}

/**
 * Get Firestore collection path for chat messages in a community
 */
export function getChatCollectionPath(communityId: string): string {
  return `${COLLECTIONS.COMMUNITIES}/${communityId}/${COLLECTIONS.CHATS}`;
}

/**
 * Get Firestore document path for a specific resource
 */
export function getResourceDocPath(communityId: string, resourceId: string): string {
  return `${COLLECTIONS.COMMUNITIES}/${communityId}/${COLLECTIONS.RESOURCES}/${resourceId}`;
}

/**
 * Get Firestore document path for a specific chat message
 */
export function getChatMessageDocPath(communityId: string, messageId: string): string {
  return `${COLLECTIONS.COMMUNITIES}/${communityId}/${COLLECTIONS.CHATS}/${messageId}`;
}

// ==================== UTILITY ====================

/**
 * Safely parse a URL and return a URL object or null
 */
export function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url, window.location.origin);
  } catch {
    return null;
  }
}
