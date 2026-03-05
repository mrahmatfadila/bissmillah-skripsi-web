import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { hasPermission } = await import('@/lib/permissions');
        const allowed = await hasPermission(session.user.role, 'dev_tools');
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Real DB counts for monitoring
        const [
            totalTickets, openTickets, inProgressTickets, pendingTickets,
            resolvedTickets, closedTickets, cancelledTickets,
            totalUsers, activeUsers,
            totalComments, totalKb, totalNotifs,
            priorityCritical, priorityHigh, priorityMedium, priorityLow,
            recentTickets,
        ] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: 'OPEN' } }),
            prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.ticket.count({ where: { status: 'PENDING' } }),
            prisma.ticket.count({ where: { status: 'RESOLVED' } }),
            prisma.ticket.count({ where: { status: 'CLOSED' } }),
            prisma.ticket.count({ where: { status: 'CANCELLED' } }),
            prisma.user.count(),
            prisma.user.count({ where: { role: { in: ['IT_SUPPORT', 'MANAGER', 'SUPERVISOR'] } } }),
            prisma.comment.count(),
            prisma.knowledgeBase.count(),
            prisma.notification.count(),
            prisma.ticket.count({ where: { priority: 'CRITICAL' } }),
            prisma.ticket.count({ where: { priority: 'HIGH' } }),
            prisma.ticket.count({ where: { priority: 'MEDIUM' } }),
            prisma.ticket.count({ where: { priority: 'LOW' } }),
            prisma.ticket.findMany({
                take: 7,
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            }),
        ]);

        // Ticket trend last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const trend: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trend[d.toISOString().slice(0, 10)] = 0;
        }
        recentTickets.forEach(t => {
            const day = t.createdAt.toISOString().slice(0, 10);
            if (trend[day] !== undefined) trend[day]++;
        });

        return NextResponse.json({
            dbStats: {
                totalTickets, openTickets, inProgressTickets, pendingTickets,
                resolvedTickets, closedTickets, cancelledTickets,
                totalUsers, activeUsers,
                totalComments, totalKb, totalNotifs,
                priorityCritical, priorityHigh, priorityMedium, priorityLow,
            },
            trendData: Object.entries(trend).map(([date, count]) => ({ date, count })),
            systemInfo: {
                dbProvider: 'NeonDB PostgreSQL',
                framework: 'Next.js 15',
                orm: 'Prisma 5',
                deployPlatform: 'Vercel',
                nodeEnv: process.env.NODE_ENV || 'production',
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[dev/monitoring]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
