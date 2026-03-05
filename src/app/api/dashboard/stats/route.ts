import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch counts
        const totalTickets = await prisma.ticket.count();
        const unassignedTickets = await prisma.ticket.count({ where: { assigneeId: null } });
        const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
        const inProgressTickets = await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
        const resolvedTickets = await prisma.ticket.count({ where: { status: 'RESOLVED' } });

        // My Tickets (Assigned or Created?)
        // Usually "Total Mine" in dashboard refers to assigned if support, or created if user.
        // Assuming Support Dashboard context since allowed roles are Admin/Support/Manager
        const myTicketsCount = await prisma.ticket.count({
            where: { assigneeId: session.user.id }
        });

        // Recent Tickets for table
        const recentTickets = await prisma.ticket.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { name: true, department: true } },
                assignee: { select: { name: true } }
            }
        });

        // Tickets by status for charts
        const ticketsByStatusRaw = await prisma.ticket.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        // Format for Chart: { name: 'Open', value: 10, fill: '#color' }
        const statusColors: any = {
            'OPEN': '#3b82f6', // blue
            'IN_PROGRESS': '#f59e0b', // amber
            'RESOLVED': '#10b981', // green
            'CLOSED': '#6b7280', // gray
            'PENDING': '#8b5cf6', // purple
            'CANCELLED': '#ef4444' // red
        };

        const ticketsByStatus = ticketsByStatusRaw.map(item => ({
            name: item.status.replace('_', ' '),
            value: item._count.status,
            fill: statusColors[item.status] || '#cbd5e1'
        }));

        // Satisfaction - Mock for now as we don't have rating field yet
        const customerSatisfaction = 85;

        return NextResponse.json({
            counts: {
                total: totalTickets,
                mine: myTicketsCount,
                unassigned: unassignedTickets,
                open: openTickets,
                inProgress: inProgressTickets,
                resolved: resolvedTickets
            },
            recentTickets,
            ticketsByStatus,
            customerSatisfaction
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
