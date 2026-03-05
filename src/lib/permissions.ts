import { prisma } from '@/lib/db';

/**
 * Get permissions for a specific role from database
 */
export async function getRolePermissions(role: string): Promise<string[]> {
    try {
        const rolePermission = await prisma.rolePermission.findUnique({
            where: { role: role as any },
        });

        if (!rolePermission) {
            return [];
        }

        return JSON.parse(rolePermission.permissions);
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return [];
    }
}

/**
 * Check if a role has a specific permission
 */
export async function hasPermission(role: string, permission: string): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true;
    const permissions = await getRolePermissions(role);
    return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export async function hasAnyPermission(role: string, permissionList: string[]): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true;
    const permissions = await getRolePermissions(role);
    return permissionList.some(p => permissions.includes(p));
}

/**
 * Check if a role has all of the specified permissions
 */
export async function hasAllPermissions(role: string, permissionList: string[]): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true;
    const permissions = await getRolePermissions(role);
    return permissionList.every(p => permissions.includes(p));
}
