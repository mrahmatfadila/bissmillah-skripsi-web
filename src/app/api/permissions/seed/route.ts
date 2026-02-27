import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: [
        "dashboard", "activity_log", "customers", "unassigned_tickets", "my_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "system_settings", "role_management",
        "profile_settings"
    ],
    IT_SUPPORT: [
        "dashboard", "unassigned_tickets", "my_tickets", "assigned_tickets", "spam_tickets",
        "status_filters", "departments",
        "knowledge_base", "reports", "profile_settings"
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
};

export async function GET() {
    try {
        let seededCount = 0;

        for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
            await prisma.rolePermission.upsert({
                where: { role: role as any },
                update: {
                    permissions: JSON.stringify(permissions),
                },
                create: {
                    role: role as any,
                    permissions: JSON.stringify(permissions),
                },
            });
            seededCount++;
        }

        return NextResponse.json({
            message: 'Permissions seeded successfully',
            count: seededCount
        });
    } catch (error) {
        console.error('Error seeding permissions:', error);
        return NextResponse.json({ error: 'Failed to seed permissions' }, { status: 500 });
    }
}
