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

        // Check role
        const isPrivileged = ['SUPER_ADMIN', 'IT_SUPPORT', 'MANAGER', 'MANAGER_IT'].includes(session.user.role);

        // Fetch cancelled tickets (spam)
        const tickets = await prisma.ticket.findMany({
            where: {
                status: 'CANCELLED',
                ...(isPrivileged ? {} : { creatorId: session.user.id }) // Users see only their own, Admins see all
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        department: true,
                        image: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Error fetching spam tickets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
