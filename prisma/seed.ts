import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = {
    SUPER_ADMIN: [
        "dashboard", "activity_log", "customers", "unassigned_tickets", "my_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "system_settings", "role_management"
    ],
    IT_SUPPORT: [
        "dashboard", "activity_log", "customers", "unassigned_tickets", "my_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports"
    ],
    MANAGER: [
        "dashboard", "my_tickets", "assigned_tickets", "status_filters",
        "departments", "knowledge_base", "reports"
    ],
    SUPERVISOR: ["my_tickets", "knowledge_base"],
    FINANCE: ["my_tickets", "knowledge_base", "edc_issues"],
    STAFF: ["my_tickets", "knowledge_base"],
    SECURITY: ["my_tickets", "knowledge_base", "cctv_issues"],
};

async function main() {
    console.log('Start seeding...');

    // 1. Seed Role Permissions
    for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
        await prisma.rolePermission.upsert({
            where: { role: role as Role },
            update: {
                permissions: JSON.stringify(permissions),
            },
            create: {
                role: role as Role,
                permissions: JSON.stringify(permissions),
            },
        });
        console.log(`Seeded permissions for role: ${role}`);
    }

    // 2. Seed Users
    const password = await bcrypt.hash('123456', 10);

    const users = [
        // 1. SUPER ADMIN
        { nik: 'MGR_IT', name: 'Pak Robby', email: 'robby@dewata.com', role: Role.SUPER_ADMIN, department: 'IT Support MIS', location: 'Kantor Jakarta' },
        { nik: 'admin', name: 'Administrator', email: 'admin@dewata.com', role: Role.SUPER_ADMIN, department: 'IT Support MIS', location: 'Kantor Jakarta' },

        // 2. IT SUPPORT
        { nik: '8117110002', name: 'Zaenal Anwar', email: 'zaenal@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support MIS', location: 'Terminal 2 & 3' },
        { nik: '8123040002', name: 'Herman Santoso', email: 'herman@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support MIS', location: 'Terminal 2 & 3' },

        // 3. MANAGER
        { nik: 'MGR_SHOP_T2', name: 'Manager Shop T2', email: 'mgr.t2@dewata.com', role: Role.MANAGER, department: 'Shop Operations', location: 'Terminal 2' },
        { nik: 'MGR_SAM', name: 'Manager SAM', email: 'mgr.sam@sam.com', role: Role.MANAGER, department: 'Shop Operations', location: 'Jakarta' },

        // 4. SUPERVISOR
        { nik: 'SPV_SHOP_T2', name: 'SPV Shop T2', email: 'spv.t2@dewata.com', role: Role.SUPERVISOR, department: 'Shop Operations', location: 'Terminal 2' },

        // 5. SECURITY
        { nik: 'SEC001', name: 'Security Officer', email: 'security@dewata.com', role: Role.SECURITY, department: 'Security', location: 'Terminal 2 & 3' },

        // 6. FINANCE
        { nik: 'FIN001', name: 'Finance Staff', email: 'finance@dewata.com', role: Role.FINANCE, department: 'Finance', location: 'Kantor Jakarta' },

        // 7. STAFF
        { nik: 'STAFF001', name: 'Office Staff', email: 'staff@dewata.com', role: Role.STAFF, department: 'General', location: 'Kantor Jakarta' },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { nik: user.nik },
            update: {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                location: user.location,
            },
            create: {
                ...user,
                password,
            },
        });
        console.log(`Seeded user: ${user.name} (${user.role})`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
