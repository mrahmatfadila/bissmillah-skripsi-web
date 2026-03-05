"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

let globalPermissionsCache: Record<string, string[]> = {};

export function usePermissions() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    const [permissions, setPermissions] = useState<string[]>(() => {
        if (role && globalPermissionsCache[role]) {
            return globalPermissionsCache[role];
        }
        return [];
    });

    const [loading, setLoading] = useState<boolean>(() => {
        if (!role) return true;
        return !globalPermissionsCache[role];
    });

    useEffect(() => {
        async function fetchPermissions() {
            if (!role) {
                setPermissions([]);
                return;
            }

            try {
                const response = await fetch(`/api/permissions/role/${role}`);
                if (response.ok) {
                    const data = await response.json();
                    const fetchedPerms = data.permissions || [];
                    setPermissions(fetchedPerms);
                    globalPermissionsCache[role] = fetchedPerms;
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
                setPermissions([]);
            } finally {
                setLoading(false);
            }
        }

        if (role && !globalPermissionsCache[role]) {
            fetchPermissions();
        } else {
            setLoading(false);
        }
    }, [role]);

    const hasPermission = (permission: string) => {
        if (role === 'SUPER_ADMIN') return true;
        return permissions.includes(permission);
    };

    const hasAnyPermission = (permissionList: string[]) => {
        if (role === 'SUPER_ADMIN') return true;
        return permissionList.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (permissionList: string[]) => {
        if (role === 'SUPER_ADMIN') return true;
        return permissionList.every(p => permissions.includes(p));
    };

    return {
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
