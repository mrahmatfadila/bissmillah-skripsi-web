export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const role = session.user.role;

        // 1. My Tickets Count (Active)
        const myTicketsCount = await prisma.ticket.count({
            where: {
                OR: [
                    { creatorId: userId },
                    { assigneeId: userId }
                ],
                status: {
                    in: ['OPEN', 'IN_PROGRESS', 'PENDING']
                }
            }
        });

        // 2. Unread Notifications Count (for "new chat" notification)
        const unreadNotificationsCount = await prisma.notification.count({
            where: {
                userId: userId,
                read: false,
                type: 'COMMENT'
            }
        });

        // 3. Unassigned Tickets (if applicable)
        let unassignedCount = 0;
        if (role === 'IT_SUPPORT' || role === 'SUPER_ADMIN' || role === 'MANAGER') {
            unassignedCount = await prisma.ticket.count({
                where: {
                    assigneeId: null,
                    status: 'OPEN'
                }
            });
        }

        return NextResponse.json({
            mine: unreadNotificationsCount, // Changed to unread notifications as per user request
            all: unreadNotificationsCount,
            unassigned: unassignedCount
        });

    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
