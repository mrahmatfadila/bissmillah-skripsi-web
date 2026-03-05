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
        if (!(await hasPermission(session.user.role, 'dev_tools')))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const now = new Date();

        // ── Fetch everything in parallel ────────────────────────────────
        const [
            tickets, users, comments, kb, notifs, permissions,
        ] = await Promise.all([
            prisma.ticket.findMany({
                include: {
                    creator: { select: { id: true, name: true, department: true, role: true } },
                    assignee: { select: { id: true, name: true, role: true } },
                    comments: { select: { id: true, createdAt: true } },
                },
            }),
            prisma.user.findMany({ select: { id: true, name: true, role: true, department: true, createdAt: true } }),
            prisma.comment.findMany({ select: { id: true, createdAt: true, ticketId: true, authorId: true } }),
            prisma.knowledgeBase.findMany({ select: { id: true, createdAt: true } }),
            prisma.notification.findMany({ select: { id: true, createdAt: true, read: true } }),
            prisma.rolePermission.count(),
        ]);

        // ── Status counts ────────────────────────────────────────────────
        const statusCounts = {
            OPEN: 0, IN_PROGRESS: 0, PENDING: 0, RESOLVED: 0, CLOSED: 0, CANCELLED: 0,
        } as Record<string, number>;
        const priorityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>;
        const categoryCounts = {} as Record<string, number>;
        const deptCounts = {} as Record<string, number>;

        tickets.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
            priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
            const cat = t.category || 'Lainnya';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            const dept = t.creator?.department || 'Unspecified';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        // ── SLA Compliance  ──────────────────────────────────────────────
        // SLA: Critical=4h, High=8h, Medium=24h, Low=48h
        const slaLimits: Record<string, number> = {
            CRITICAL: 4 * 60 * 60 * 1000,
            HIGH: 8 * 60 * 60 * 1000,
            MEDIUM: 24 * 60 * 60 * 1000,
            LOW: 48 * 60 * 60 * 1000,
        };
        let slaCompliant = 0, slaViolated = 0, slaPending = 0;
        const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
        resolvedTickets.forEach(t => {
            const elapsed = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
            const limit = slaLimits[t.priority] || slaLimits.MEDIUM;
            if (elapsed <= limit) slaCompliant++; else slaViolated++;
        });
        const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
        openTickets.forEach(t => {
            const elapsed = now.getTime() - new Date(t.createdAt).getTime();
            const limit = slaLimits[t.priority] || slaLimits.MEDIUM;
            if (elapsed > limit) slaViolated++; else slaPending++;
        });
        const slaTotal = slaCompliant + slaViolated;
        const slaRate = slaTotal > 0 ? Math.round((slaCompliant / slaTotal) * 100) : 100;

        // ── Avg resolution time (hours) ──────────────────────────────────
        let totalResMs = 0;
        resolvedTickets.forEach(t => {
            totalResMs += new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        });
        const avgResolutionHours = resolvedTickets.length > 0
            ? Math.round(totalResMs / resolvedTickets.length / 3600000 * 10) / 10
            : 0;

        // ── Top assignees ────────────────────────────────────────────────
        const assigneeMap: Record<string, { name: string; resolved: number; total: number }> = {};
        tickets.forEach(t => {
            if (t.assignee) {
                const k = t.assignee.id;
                if (!assigneeMap[k]) assigneeMap[k] = { name: t.assignee.name || '?', resolved: 0, total: 0 };
                assigneeMap[k].total++;
                if (t.status === 'RESOLVED' || t.status === 'CLOSED') assigneeMap[k].resolved++;
            }
        });
        const topAssignees = Object.values(assigneeMap)
            .sort((a, b) => b.resolved - a.resolved)
            .slice(0, 8);

        // ── Trend last 30 days ───────────────────────────────────────────
        const trend30: Record<string, { created: number; resolved: number }> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trend30[d.toISOString().slice(0, 10)] = { created: 0, resolved: 0 };
        }
        tickets.forEach(t => {
            const c = t.createdAt.toISOString().slice(0, 10);
            if (trend30[c]) trend30[c].created++;
            if ((t.status === 'RESOLVED' || t.status === 'CLOSED')) {
                const r = t.updatedAt.toISOString().slice(0, 10);
                if (trend30[r]) trend30[r].resolved++;
            }
        });

        // ── Activity by day of week ──────────────────────────────────────
        const dowCreated = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
        const dowComments = [0, 0, 0, 0, 0, 0, 0];
        tickets.forEach(t => { dowCreated[new Date(t.createdAt).getDay()]++; });
        comments.forEach(c => { dowComments[new Date(c.createdAt).getDay()]++; });

        // ── Hourly heatmap (tickets created by hour) ─────────────────────
        const hourlyDist = new Array(24).fill(0);
        tickets.forEach(t => { hourlyDist[new Date(t.createdAt).getHours()]++; });

        // ── Comments activity per day (last 14 days) ─────────────────────
        const commentTrend: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            commentTrend[d.toISOString().slice(0, 10)] = 0;
        }
        comments.forEach(c => {
            const d = c.createdAt.toISOString().slice(0, 10);
            if (commentTrend[d] !== undefined) commentTrend[d]++;
        });

        // ── Role distribution ────────────────────────────────────────────
        const roleDist: Record<string, number> = {};
        users.forEach(u => { roleDist[u.role] = (roleDist[u.role] || 0) + 1; });

        return NextResponse.json({
            generatedAt: now.toISOString(),
            counts: {
                tickets: tickets.length,
                users: users.length,
                comments: comments.length,
                kb: kb.length,
                notifications: notifs.length,
                unreadNotifs: notifs.filter(n => !n.read).length,
                permissions,
                resolvedTickets: resolvedTickets.length,
                openTickets: openTickets.length,
            },
            statusCounts,
            priorityCounts,
            categoryCounts: Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1]).slice(0, 10)
                .map(([name, value]) => ({ name, value })),
            deptCounts: Object.entries(deptCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, value]) => ({ name, value })),
            sla: { compliant: slaCompliant, violated: slaViolated, pending: slaPending, rate: slaRate },
            avgResolutionHours,
            topAssignees,
            trend30: Object.entries(trend30).map(([date, data]) => ({ date, ...data })),
            dowActivity: [0, 1, 2, 3, 4, 5, 6].map(i => ({
                day: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i],
                created: dowCreated[i],
                comments: dowComments[i],
            })),
            hourlyDist: hourlyDist.map((count, hour) => ({ hour: `${String(hour).padStart(2, '0')}:00`, count })),
            commentTrend: Object.entries(commentTrend).map(([date, count]) => ({ date, count })),
            roleDist: Object.entries(roleDist).map(([role, count]) => ({ role, count })),
            systemInfo: {
                dbProvider: 'NeonDB PostgreSQL',
                framework: 'Next.js 16',
                orm: 'Prisma 5',
                deployPlatform: 'Vercel',
                nodeEnv: process.env.NODE_ENV || 'production',
            },
        });
    } catch (error) {
        console.error('[dev/monitoring]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
