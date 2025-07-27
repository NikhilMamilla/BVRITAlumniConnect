// communityHelpers.ts
// Advanced, Firestore-compliant community helpers for the community platform

import type { Community, CommunityRole } from '../types/community.types';
import type { DetailedCommunityMember } from '../types/member.types';

// Check if a user is the owner of the community
export function isOwner(
  community: Community | null | undefined,
  userId: string | null | undefined
): boolean {
  return !!community && !!userId && community.owner?.id === userId;
}

// Check if a member is an admin
export function isAdmin(
  member: DetailedCommunityMember | null | undefined
): boolean {
  return !!member && member.role === 'admin';
}

// Check if a member is a moderator
export function isModerator(
  member: DetailedCommunityMember | null | undefined
): boolean {
  return !!member && member.role === 'moderator';
}

// Check if a member is a regular member (not admin/moderator/owner)
export function isMember(
  member: DetailedCommunityMember | null | undefined
): boolean {
  return !!member && ['member', 'contributor', 'alumni_mentor'].includes(member.role);
}

// Generate a slug for a community name
export function generateCommunitySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

// Validate a community slug
export function validateCommunitySlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// Get member count from community object
export function getMemberCount(community: Community | null | undefined): number {
  return community?.memberCount || 0;
}

// Check if a community has a specific feature enabled
export function hasFeature(
  community: Community | null | undefined,
  feature: keyof Community['features']
): boolean {
  return !!community && !!community.features && !!community.features[feature];
}

// Can a user join the community?
export function canJoinCommunity(
  community: Community | null | undefined,
  member: DetailedCommunityMember | null | undefined
): boolean {
  if (!community) return false;
  if (!member) return true; // Not a member yet
  return member.status !== 'active' && member.status !== 'banned';
}

// Can a user leave the community?
export function canLeaveCommunity(
  community: Community | null | undefined,
  member: DetailedCommunityMember | null | undefined
): boolean {
  if (!community || !member) return false;
  if (isOwner(community, member.id)) return false; // Owner cannot leave
  return member.status === 'active';
} 