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

        // 4. Status Counts
        const whereStatus: any = {
            assigneeId: userId
        };

        const statusCountsRaw = await prisma.ticket.groupBy({
            by: ['status'],
            where: whereStatus,
            _count: { status: true }
        });

        const statusCounts = statusCountsRaw.reduce((acc: any, curr) => {
            acc[curr.status.toLowerCase()] = curr._count.status;
            return acc;
        }, { open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0, cancelled: 0 });

        return NextResponse.json({
            mine: unreadNotificationsCount, // Changed to unread notifications as per user request
            all: unreadNotificationsCount,
            unassigned: unassignedCount,
            ...statusCounts
        });

    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
