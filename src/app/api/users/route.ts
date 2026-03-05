import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        console.log("API /api/users session:", session ? "Active" : "None");
        if (session?.user) {
            console.log("User Role:", session.user.role);
        }

        // Only Super Admin can access
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            console.log(`Unauthorized access attempt. Current role: ${session?.user?.role}`);
            return NextResponse.json({
                error: `Unauthorized: You must be SUPER_ADMIN. Your current role is: ${session?.user?.role || 'None'}`
            }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                nik: true,
                name: true,
                email: true,
                role: true,
                department: true,
                location: true,
                image: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({
            error: 'Failed to fetch users',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
