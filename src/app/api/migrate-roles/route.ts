import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        // Update all ASSISTANT_MANAGER_IT to MANAGER_IT
        await prisma.$executeRaw`UPDATE "User" SET role = 'MANAGER_IT' WHERE role = 'ASSISTANT_MANAGER_IT'`;

        // Delete ADMIN role users (we'll recreate as SUPER_ADMIN)
        await prisma.$executeRaw`UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN'`;

        return NextResponse.json({ message: 'Roles migrated successfully' });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: 'Failed to migrate roles' }, { status: 500 });
    }
}
