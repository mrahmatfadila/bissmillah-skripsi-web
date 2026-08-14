// Static default permissions for each role
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

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(role: string): Promise<string[]> {
    return DEFAULT_PERMISSIONS[role] || [];
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
