"use client";

import { useSession } from 'next-auth/react';

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: [
        "dashboard", "activity_log", "unassigned_tickets", "my_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "role_management",
        "upload_schedule", "shift_schedule", "profile_settings", "dev_tools"
    ],
    IT_SUPPORT: [
        "dashboard", "activity_log", "unassigned_tickets", "my_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "role_management",
        "upload_schedule", "shift_schedule", "profile_settings"
    ],
    MANAGER: [
        "dashboard", "my_tickets", "assigned_tickets", "status_filters",
        "departments", "knowledge_base", "reports", "profile_settings"
    ],
    SUPERVISOR: ["my_tickets", "knowledge_base", "profile_settings"],
    FINANCE: [
        "unassigned_tickets", "my_tickets", "assigned_tickets", "spam_tickets",
        "status_filters", "knowledge_base", "edc_issues", "profile_settings"
    ],
    STAFF: ["my_tickets", "knowledge_base", "profile_settings"],
    SECURITY: [
        "unassigned_tickets", "my_tickets", "assigned_tickets", "spam_tickets",
        "status_filters", "knowledge_base", "cctv_issues", "profile_settings"
    ],
    SUPERVISOR_SHOP: [
        "my_tickets", "knowledge_base", "profile_settings"
    ],
};

export function usePermissions() {
    const { data: session } = useSession();
    const role = (session as any)?.user?.role;

    const permissions = role ? DEFAULT_PERMISSIONS[role] || [] : [];
    const loading = false; // Static lookup is instant

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
