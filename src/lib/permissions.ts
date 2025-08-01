import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface UserPermission {
  resource: string;
  action: string;
}

export interface UserWithPermissions {
  id: string;
  email: string;
  permissions: UserPermission[];
  roles: {
    id: string;
    name: string;
    displayName: string;
    level: number;
  }[];
}

/**
 * Get all permissions for a user across all their roles
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { 
      userId,
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  // Collect all unique permissions
  const permissionSet = new Set<string>();
  const permissions: UserPermission[] = [];

  userRoles.forEach(userRole => {
    userRole.role.permissions.forEach(rolePermission => {
      const key = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
      if (!permissionSet.has(key)) {
        permissionSet.add(key);
        permissions.push({
          resource: rolePermission.permission.resource,
          action: rolePermission.permission.action
        });
      }
    });
  });

  return permissions;
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.resource === resource && p.action === action);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissionChecks: Array<{ resource: string; action: string }>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissionChecks.some(check =>
    permissions.some(p => p.resource === check.resource && p.action === check.action)
  );
}

/**
 * Get user with roles and permissions
 */
export async function getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        where: {
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  const permissions = await getUserPermissions(userId);
  const roles = user.userRoles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    displayName: ur.role.displayName,
    level: ur.role.level
  }));

  return {
    id: user.id,
    email: user.email,
    permissions,
    roles
  };
}

/**
 * Middleware to check permissions in API routes
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<{ authorized: boolean; session: any; error?: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { authorized: false, session: null, error: "Unauthorized" };
  }

  const hasRequiredPermission = await hasPermission(session.user.id, resource, action);
  
  if (!hasRequiredPermission) {
    return { 
      authorized: false, 
      session, 
      error: `Insufficient permissions: ${resource}:${action}` 
    };
  }

  return { authorized: true, session };
}

/**
 * Get the highest role level for a user (lower number = higher authority)
 */
export async function getUserHighestRoleLevel(userId: string): Promise<number> {
  const userRoles = await prisma.userRole.findMany({
    where: { 
      userId,
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    },
    include: {
      role: true
    }
  });

  if (userRoles.length === 0) return 999; // No roles = lowest level

  return Math.min(...userRoles.map(ur => ur.role.level));
}

/**
 * Check if user can access chat feature
 */
export async function canAccessChat(userId: string): Promise<boolean> {
  return hasPermission(userId, 'chat', 'access');
}

/**
 * Get role hierarchy - returns roles that a user can manage
 */
export async function getManageableRoles(userId: string): Promise<any[]> {
  const userLevel = await getUserHighestRoleLevel(userId);
  
  // Can only manage roles at the same level or lower (higher number)
  const roles = await prisma.role.findMany({
    where: {
      level: { gte: userLevel },
      isActive: true
    },
    orderBy: {
      level: 'asc'
    }
  });

  return roles;
}