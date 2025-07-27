// permissionHelpers.ts
// Advanced, Firestore-compliant permission helpers for the community platform

import type {
  UserRole,
  PermissionAction,
  PermissionResource,
} from '../types/common.types';
import type {
  CommunityRole,
} from '../types/community.types';
import type {
  DetailedCommunityMember,
  CustomPermission,
  CustomRole,
  AccessLevel,
  PermissionCondition,
} from '../types/member.types';
import { COMMUNITY_ROLES, USER_ROLES, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from './constants';

// ==================== TYPE GUARDS ====================

export function isCommunityRole(role: unknown): role is CommunityRole {
  return typeof role === 'string' && COMMUNITY_ROLES.includes(role as CommunityRole);
}

export function isUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && USER_ROLES.includes(role as UserRole);
}

export function isPermissionAction(action: unknown): action is PermissionAction {
  return typeof action === 'string' && PERMISSION_ACTIONS.includes(action as PermissionAction);
}

export function isPermissionResource(resource: unknown): resource is PermissionResource {
  return typeof resource === 'string' && PERMISSION_RESOURCES.includes(resource as PermissionResource);
}

// ==================== ROLE & ACCESS CHECKS ====================

export function hasRole(
  member: { role?: string | null } | null | undefined,
  role: CommunityRole | UserRole
): boolean {
  return !!member && member.role === role;
}

export function hasAnyRole(
  member: { role?: string | null } | null | undefined,
  roles: (CommunityRole | UserRole)[]
): boolean {
  return !!member && !!member.role && roles.includes(member.role as CommunityRole | UserRole);
}

export function hasAccessLevel(
  member: { accessLevel?: AccessLevel } | null | undefined,
  level: AccessLevel
): boolean {
  return !!member && member.accessLevel === level;
}

// ==================== EFFECTIVE PERMISSIONS ====================

export function getEffectivePermissions(
  member: DetailedCommunityMember | null | undefined
): string[] {
  if (!member) return [];
  // Combine role-based, custom role, and custom permissions
  const rolePerms = (member.permissions || []).map(p => p.action);
  const customPerms = (member.customPermissions || []).map(p => p.name);
  const customRolePerms = member.customRole?.permissions || [];
  return Array.from(new Set([...rolePerms, ...customPerms, ...customRolePerms]));
}

// ==================== PERMISSION CHECKS ====================

export function hasPermission(
  member: DetailedCommunityMember | null | undefined,
  permission: string
): boolean {
  if (!member) return false;
  // Check in permissions array (role-based)
  if (member.permissions?.some(p => p.action === permission && p.granted)) return true;
  // Check in customPermissions array (if present, treated as granted)
  if (member.customPermissions?.some(p => p.name === permission)) return true;
  // Check in customRole permissions
  if (member.customRole?.permissions?.includes(permission)) return true;
  return false;
}

export function hasAllPermissions(
  member: DetailedCommunityMember | null | undefined,
  permissions: string[]
): boolean {
  if (!member) return false;
  const effective = getEffectivePermissions(member);
  return permissions.every(p => effective.includes(p));
}

export function hasAnyPermission(
  member: DetailedCommunityMember | null | undefined,
  permissions: string[]
): boolean {
  if (!member) return false;
  const effective = getEffectivePermissions(member);
  return permissions.some(p => effective.includes(p));
}

// ==================== ADVANCED CONDITIONAL PERMISSIONS ====================

export function checkPermissionConditions(
  conditions: PermissionCondition[] | undefined,
  context: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  // All conditions must be satisfied
  return conditions.every(cond => {
    const value = context[cond.type];
    switch (cond.operator) {
      case '==': return value === cond.value;
      case '!=': return value !== cond.value;
      case '>': return typeof value === 'number' && value > (cond.value as number);
      case '<': return typeof value === 'number' && value < (cond.value as number);
      case 'in': return Array.isArray(cond.value) && cond.value.includes(value);
      case 'contains': return Array.isArray(value) && value.includes(cond.value);
      default: return false;
    }
  });
}

export function hasConditionalPermission(
  member: DetailedCommunityMember | null | undefined,
  permission: string,
  context: Record<string, unknown>
): boolean {
  if (!member) return false;
  // Check in customPermissions with conditions (if present, treated as granted if conditions pass)
  if (member.customPermissions?.some(p => p.name === permission && checkPermissionConditions(p.conditions, context))) return true;
  // Check in customRole permissions (no conditions)
  if (member.customRole?.permissions?.includes(permission)) return true;
  // Check in permissions array (role-based, no conditions)
  if (member.permissions?.some(p => p.action === permission && p.granted)) return true;
  return false;
}

// ==================== FEATURE ACCESS HELPERS ====================

export function canModerate(member: DetailedCommunityMember | null | undefined): boolean {
  return hasAnyRole(member, ['moderator', 'admin', 'owner']) || hasPermission(member, 'moderate');
}

export function canInvite(member: DetailedCommunityMember | null | undefined): boolean {
  return hasPermission(member, 'invite') || !!member?.canInviteMembers;
}

export function canShareResources(member: DetailedCommunityMember | null | undefined): boolean {
  return hasPermission(member, 'share_resource') || !!member?.canShareResources;
}

export function canCreateEvents(member: DetailedCommunityMember | null | undefined): boolean {
  return hasPermission(member, 'manage_events') || !!member?.canCreateEvents;
}

export function canAccessAnalytics(member: DetailedCommunityMember | null | undefined): boolean {
  return hasPermission(member, 'view_analytics');
}

// ==================== HIERARCHY & CUSTOM ROLES ====================

export function getRoleHierarchy(role: CustomRole | null | undefined): number {
  return role?.hierarchy ?? 0;
}

export function isHigherRole(roleA: CustomRole | null | undefined, roleB: CustomRole | null | undefined): boolean {
  return getRoleHierarchy(roleA) > getRoleHierarchy(roleB);
} 