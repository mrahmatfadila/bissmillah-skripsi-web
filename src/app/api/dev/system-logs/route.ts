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

        const now = new Date();

        // ── Real DB stats ───────────────────────────────────────
        const [
            totalTickets, openTickets, resolvedTickets,
            totalUsers, totalComments, totalNotifs,
            recentTickets, recentComments,
        ] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: 'OPEN' } }),
            prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
            prisma.user.count(),
            prisma.comment.count(),
            prisma.notification.count(),
            prisma.ticket.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, ticketNumber: true, title: true,
                    status: true, priority: true, createdAt: true,
                    creator: { select: { name: true } },
                },
            }),
            prisma.comment.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, content: true, createdAt: true,
                    author: { select: { name: true } },
                    ticket: { select: { ticketNumber: true } },
                },
            }),
        ]);

        // ── Simulate log entries from real activity ─────────────
        const logs = [
            { level: 'INFO', ts: now.toISOString(), msg: `DB healthy — ${totalTickets} tiket, ${totalUsers} user` },
            { level: 'INFO', ts: new Date(now.getTime() - 5000).toISOString(), msg: 'Prisma Client connected to NeonDB PostgreSQL' },
            { level: 'INFO', ts: new Date(now.getTime() - 10000).toISOString(), msg: `NextAuth session validated — role: ${session.user.role}` },
            ...recentComments.map((c, i) => ({
                level: 'INFO' as const,
                ts: c.createdAt.toISOString(),
                msg: `COMMENT by ${c.author.name} on [${c.ticket.ticketNumber}]: ${c.content.slice(0, 60)}${c.content.length > 60 ? '...' : ''}`,
            })),
            ...recentTickets.slice(0, 4).map((t) => ({
                level: (t.priority === 'CRITICAL' ? 'WARN' : 'INFO') as 'WARN' | 'INFO',
                ts: t.createdAt.toISOString(),
                msg: `TICKET CREATED [${t.ticketNumber}] "${t.title}" — priority: ${t.priority}`,
            })),
            { level: 'SUCCESS', ts: new Date(now.getTime() - 60000).toISOString(), msg: `Resolved tiket count: ${resolvedTickets}` },
            { level: 'INFO', ts: new Date(now.getTime() - 90000).toISOString(), msg: `Open tiket count: ${openTickets}` },
            { level: 'INFO', ts: new Date(now.getTime() - 120000).toISOString(), msg: `Total notifikasi tersimpan: ${totalNotifs}` },
            { level: 'INFO', ts: new Date(now.getTime() - 150000).toISOString(), msg: `Total komentar: ${totalComments}` },
        ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

        return NextResponse.json({
            stats: { totalTickets, openTickets, resolvedTickets, totalUsers, totalComments, totalNotifs },
            logs,
        });
    } catch (error) {
        console.error('[dev/system-logs]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
