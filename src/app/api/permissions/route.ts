import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only Super Admin can access
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const rolePermissions = await prisma.rolePermission.findMany({
            orderBy: {
                role: 'asc',
            },
        });

        // Parse JSON permissions
        const formattedPermissions = rolePermissions.map(rp => ({
            ...rp,
            permissions: JSON.parse(rp.permissions),
        }));

        return NextResponse.json(formattedPermissions);
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}
