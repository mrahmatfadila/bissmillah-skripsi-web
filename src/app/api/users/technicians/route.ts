import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow Managers, IT Support, Super Admin to see list of technicians
        const allowedRoles = ['IT_SUPPORT', 'SUPERVISOR_SHOP'];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const technicians = await prisma.user.findMany({
            where: {
                role: 'IT_SUPPORT',
                nik: {
                    not: 'admin' // Exclude administrator account from assignee dropdown
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(technicians);
    } catch (error) {
        console.error('Error fetching technicians:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
