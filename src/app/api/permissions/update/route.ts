import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only Super Admin can update permissions
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { role, permissions } = body;

        if (!role || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Upsert role permissions
        const updated = await prisma.rolePermission.upsert({
            where: { role },
            update: {
                permissions: JSON.stringify(permissions),
            },
            create: {
                role,
                permissions: JSON.stringify(permissions),
            },
        });

        return NextResponse.json({
            ...updated,
            permissions: JSON.parse(updated.permissions),
        });
    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
    }
}
