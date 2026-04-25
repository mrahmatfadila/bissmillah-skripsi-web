import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = {
    IT_SUPPORT: [
        "dashboard", "activity_log", "unassigned_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "system_settings", "role_management", "upload_schedule", "shift_schedule", "profile_settings"
    ],
    SUPERVISOR_SHOP: [
        "my_tickets", "knowledge_base", "profile_settings"
    ],
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
        // IT SUPPORT
        { nik: 'MGR_IT', name: 'Pak Robby', email: 'robby@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: 'admin', name: 'Administrator', email: 'admin@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8117110002', name: 'Zaenal Anwar', email: 'zaenal@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8123040002', name: 'Herman Santoso', email: 'herman@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8124070002', name: 'Muhamad Rahmat Fadila', email: 'rahmat@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },

        // SUPERVISOR SHOP
        { nik: 'MGR_SHOP_T2', name: 'Manager Shop T2', email: 'mgr.t2@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
        { nik: 'MGR_SAM', name: 'Manager SAM', email: 'mgr.sam@sam.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
        { nik: 'SPV_SHOP_T2', name: 'SPV Shop T2', email: 'spv.t2@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
        { nik: 'SPV_SHOP_T3', name: 'SPV Shop T3', email: 'spv.t3@daw.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
        { nik: 'STAFF001', name: 'Office Staff', email: 'staff@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2 & 3' },
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
