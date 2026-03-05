import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const password = await bcrypt.hash('123456', 10);

        const users = [
            // 1. SUPER ADMIN
            { nik: 'admin', name: 'Administrator', email: 'admin@dewata.com', role: Role.SUPER_ADMIN, department: 'IT Support MIS', location: 'Kantor Bali' },


            // 2. IT SUPPORT
            { nik: '8117110002', name: 'Zaenal Anwar', email: 'zaenal@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support MIS', location: 'Terminal 2 & 3' },
            { nik: '8123040002', name: 'Herman Santoso', email: 'herman@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support MIS', location: 'Terminal 2 & 3' },
            { nik: '8124070002', name: 'Muhamad Rahmat Fadila', email: 'rahmat@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support MIS', location: 'Terminal 2 & 3' },

            // 3. MANAGER
            { nik: 'MGR_IT', name: 'Pak Robby', email: 'robby@dewata.com', role: Role.MANAGER, department: 'IT Support MIS', location: 'Kantor Bali' },
            { nik: 'MGR_SHOP_T2', name: 'Manager Shop T2', email: 'mgr.t2@dewata.com', role: Role.MANAGER, department: 'Shop Operations', location: 'Terminal 2' },
            { nik: 'MGR_SAM', name: 'Manager SAM', email: 'mgr.sam@sam.com', role: Role.MANAGER, department: 'Shop Operations', location: 'Jakarta' },


            // 4. SUPERVISOR
            { nik: 'SPV_SHOP_T2', name: 'SPV Shop T2', email: 'spv.t2@dewata.com', role: Role.SUPERVISOR, department: 'Shop Operations', location: 'Terminal 2' },
            { nik: 'SPV_SHOP_T3', name: 'SPV_SHOP_T3', email: 'spv.t3@daw.com', role: Role.SUPERVISOR, department: 'Shop Operations', location: 'Terminal 3' },


            // 5. SECURITY
            { nik: 'SEC001', name: 'Security Officer', email: 'security@dewata.com', role: Role.SECURITY, department: 'Security', location: 'Terminal 2 & 3' },

            // 6. FINANCE
            { nik: 'FIN001', name: 'Finance Staff', email: 'finance@dewata.com', role: Role.FINANCE, department: 'Finance', location: 'Kantor Bali' },

            // 7. STAFF
            { nik: 'STAFF001', name: 'Office Staff', email: 'staff@dewata.com', role: Role.STAFF, department: 'General', location: 'Kantor Bali' },
        ];

        // Upsert users
        let count = 0;
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
            count++;
        }

        return NextResponse.json({ message: 'Database seeded successfully', count });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
