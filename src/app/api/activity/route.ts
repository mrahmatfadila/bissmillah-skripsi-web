import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '60'), 200);
        const typeFilter = searchParams.get('type') || 'ALL';

        // ── Fetch all activity sources in parallel ──────────────────
        const [comments, tickets, assignedTickets] = await Promise.all([
            prisma.comment.findMany({
                take: 80,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, name: true, image: true, role: true } },
                    ticket: { select: { id: true, ticketNumber: true, title: true, status: true, priority: true } },
                },
            }),
            prisma.ticket.findMany({
                take: 60,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: { select: { id: true, name: true, image: true, role: true } },
                    assignee: { select: { id: true, name: true, image: true, role: true } },
                },
            }),
            // Tickets updated recently (status change proxy)
            prisma.ticket.findMany({
                take: 60,
                where: { status: { not: 'OPEN' } },
                orderBy: { updatedAt: 'desc' },
                include: {
                    assignee: { select: { id: true, name: true, image: true, role: true } },
                    creator: { select: { id: true, name: true, image: true, role: true } },
                },
            }),
        ]);

        const STATUS_LABEL: Record<string, string> = {
            OPEN: 'Terbuka', IN_PROGRESS: 'Diproses', PENDING: 'Tertunda',
            RESOLVED: 'Selesai', CLOSED: 'Ditutup', CANCELLED: 'Dibatalkan',
        };
        const PRIORITY_LABEL: Record<string, string> = {
            CRITICAL: 'Kritis', HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah',
        };

        type ActivityEntry = {
            id: string;
            type: 'comment' | 'ticket_created' | 'status_changed' | 'assigned';
            ticketId: string;
            ticketNumber: string;
            ticketTitle: string;
            content: string;
            priority: string;
            status: string;
            actor: { id: string; name: string | null; image: string | null; role: string };
            createdAt: string;
        };

        const activities: ActivityEntry[] = [];

        // 1. Comments
        comments.forEach(c => {
            activities.push({
                id: `comment-${c.id}`,
                type: 'comment',
                ticketId: c.ticket.id,
                ticketNumber: c.ticket.ticketNumber,
                ticketTitle: c.ticket.title,
                content: c.content.length > 120 ? c.content.slice(0, 120) + '…' : c.content,
                priority: (c.ticket as any).priority || 'MEDIUM',
                status: c.ticket.status,
                actor: { id: c.author.id, name: c.author.name, image: c.author.image, role: c.author.role },
                createdAt: c.createdAt.toISOString(),
            });
        });

        // 2. Ticket created
        tickets.forEach(t => {
            activities.push({
                id: `created-${t.id}`,
                type: 'ticket_created',
                ticketId: t.id,
                ticketNumber: t.ticketNumber,
                ticketTitle: t.title,
                content: `Tiket baru dibuat dengan prioritas ${PRIORITY_LABEL[t.priority] || t.priority}`,
                priority: t.priority,
                status: t.status,
                actor: { id: t.creator.id, name: t.creator.name, image: t.creator.image, role: t.creator.role },
                createdAt: t.createdAt.toISOString(),
            });
        });

        // 3. Status changes (tickets that moved from OPEN)
        assignedTickets.forEach(t => {
            const actor = t.assignee || t.creator;
            activities.push({
                id: `status-${t.id}`,
                type: 'status_changed',
                ticketId: t.id,
                ticketNumber: t.ticketNumber,
                ticketTitle: t.title,
                content: `Status diubah menjadi "${STATUS_LABEL[t.status] || t.status}"`,
                priority: t.priority,
                status: t.status,
                actor: { id: actor.id, name: actor.name, image: actor.image, role: actor.role },
                createdAt: t.updatedAt.toISOString(),
            });
        });

        // 4. Assignment events
        tickets
            .filter(t => t.assigneeId)
            .forEach(t => {
                activities.push({
                    id: `assign-${t.id}`,
                    type: 'assigned',
                    ticketId: t.id,
                    ticketNumber: t.ticketNumber,
                    ticketTitle: t.title,
                    content: `Tiket ditugaskan kepada ${t.assignee?.name || 'teknisi'}`,
                    priority: t.priority,
                    status: t.status,
                    actor: { id: t.creator.id, name: t.creator.name, image: t.creator.image, role: t.creator.role },
                    createdAt: t.createdAt.toISOString(),
                });
            });

        // Sort by date desc, deduplicate, filter, limit
        const seen = new Set<string>();
        const sorted = activities
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .filter(a => {
                if (seen.has(a.id)) return false;
                seen.add(a.id);
                return typeFilter === 'ALL' || a.type === typeFilter;
            })
            .slice(0, limit);

        // Summary stats
        const typeCounts = sorted.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({ activities: sorted, typeCounts, total: sorted.length });
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
