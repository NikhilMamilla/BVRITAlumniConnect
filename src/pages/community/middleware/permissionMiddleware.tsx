// permissionMiddleware.tsx
// Client-side permission middleware for community platform

import * as React from 'react';
import type { CommunityRole } from '../types/community.types';
import type { PermissionAction } from '../types/common.types';
import { MemberService } from '../services/memberService';
import { useAuth } from '../../../AuthContext';
import { useCommunityContext } from '../contexts/CommunityContext';

const memberService = MemberService.getInstance();

/**
 * Hook to check if user has required roles for a community action
 */
export function usePermissionCheck() {
  const { currentUser } = useAuth();
  const { currentCommunity, currentMember } = useCommunityContext();

  const hasRole = React.useCallback((requiredRoles: CommunityRole[]): boolean => {
    if (!currentUser || !currentMember) return false;
    return requiredRoles.includes(currentMember.role);
  }, [currentUser, currentMember]);

  const hasPermission = React.useCallback((requiredPermissions: PermissionAction[]): boolean => {
    if (!currentUser || !currentMember) return false;
    
    // Get member permissions from the current member object
    const memberPermissions = currentMember.permissions?.map(p => p.action) || [];
    
    // Check if user has all required permissions
    return requiredPermissions.every(permission => 
      memberPermissions.includes(permission)
    );
  }, [currentUser, currentMember]);

  const canPerformAction = React.useCallback((
    requiredRoles?: CommunityRole[],
    requiredPermissions?: PermissionAction[]
  ): boolean => {
    if (!currentUser || !currentMember) return false;

    // Check roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasRole(requiredRoles)) return false;
    }

    // Check permissions if specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasPermission(requiredPermissions)) return false;
    }

    return true;
  }, [currentUser, currentMember, hasRole, hasPermission]);

  return {
    hasRole,
    hasPermission,
    canPerformAction,
    isAuthenticated: !!currentUser,
    isMember: !!currentMember,
    userRole: currentMember?.role,
    userPermissions: currentMember?.permissions?.map(p => p.action) || []
  };
}

/**
 * Higher-order component to wrap components that require specific permissions
 */
export function withPermission<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles?: CommunityRole[],
  requiredPermissions?: PermissionAction[],
  fallbackComponent?: React.ComponentType<P>
) {
  return function PermissionWrapper(props: P) {
    const { canPerformAction, isAuthenticated, isMember } = usePermissionCheck();

    // Check if user can perform the action
    if (!canPerformAction(requiredRoles, requiredPermissions)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            {!isAuthenticated 
              ? 'Please log in to access this feature.'
              : !isMember 
                ? 'You must be a member of this community to access this feature.'
                : 'You do not have the required permissions to access this feature.'
            }
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Component that conditionally renders based on permissions
 */
export function PermissionGate({
  children,
  requiredRoles,
  requiredPermissions,
  fallback
}: {
  children: React.ReactNode;
  requiredRoles?: CommunityRole[];
  requiredPermissions?: PermissionAction[];
  fallback?: React.ReactNode;
}) {
  const { canPerformAction } = usePermissionCheck();

  if (!canPerformAction(requiredRoles, requiredPermissions)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Hook to get permission-based UI states
 */
export function usePermissionUI() {
  const { hasRole, hasPermission, canPerformAction, userRole } = usePermissionCheck();

  const canModerate = React.useMemo(() => 
    hasRole(['moderator', 'admin', 'owner']), 
    [hasRole]
  );

  const canAdmin = React.useMemo(() => 
    hasRole(['admin', 'owner']), 
    [hasRole]
  );

  const canManageMembers = React.useMemo(() => 
    hasPermission(['moderate', 'admin']) || hasRole(['moderator', 'admin', 'owner']), 
    [hasPermission, hasRole]
  );

  const canCreateContent = React.useMemo(() => 
    hasPermission(['create']) || hasRole(['member', 'contributor', 'moderator', 'admin', 'owner']), 
    [hasPermission, hasRole]
  );

  const canDeleteContent = React.useMemo(() => 
    hasPermission(['delete']) || hasRole(['moderator', 'admin', 'owner']), 
    [hasPermission, hasRole]
  );

  const canInviteMembers = React.useMemo(() => 
    hasPermission(['invite']) || hasRole(['moderator', 'admin', 'owner']), 
    [hasPermission, hasRole]
  );

  return {
    canModerate,
    canAdmin,
    canManageMembers,
    canCreateContent,
    canDeleteContent,
    canInviteMembers,
    userRole,
    isOwner: userRole === 'owner',
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator',
    isMember: userRole === 'member',
    isContributor: userRole === 'contributor'
  };
} 