import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ role: string }> }
) {
    try {
        const { role } = await params;

        const rolePermission = await prisma.rolePermission.findUnique({
            where: { role: role as any },
        });

        if (!rolePermission) {
            return NextResponse.json({ permissions: [] });
        }

        return NextResponse.json({
            role: rolePermission.role,
            permissions: JSON.parse(rolePermission.permissions),
        });
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}
