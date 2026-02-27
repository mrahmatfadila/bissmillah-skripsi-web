import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    const allowedRoles = ['SUPER_ADMIN', 'IT_SUPPORT', 'MANAGER', 'ASSISTANT_MANAGER_IT', 'MANAGER_SHOP', 'MANAGER_SAM'];
    if (!role || !allowedRoles.includes(role)) {
        redirect('/tickets/mine');
    }

    // --- 1. KPI Data ---
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const canceledTickets = await prisma.ticket.count({ where: { status: 'CANCELLED' } });

    // Avg CSAT (Mock or Real) - assuming AHP score is proxy for now, or just calculate from logic
    // Let's use AHP Score average if available
    const ahpAgg = await prisma.ticket.aggregate({
        _avg: { ahpScore: true },
        where: { ahpScore: { not: null } }
    });
    const avgAhp = ahpAgg._avg.ahpScore || 0;


    // --- 2. Volume Trends (Last 7 Days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days inc today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTickets = await prisma.ticket.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true }
    });

    const trendMap: Record<string, { total: number; resolved: number }> = {};

    // Initialize map
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        trendMap[key] = { total: 0, resolved: 0 };
    }

    recentTickets.forEach(t => {
        const key = t.createdAt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        if (trendMap[key]) {
            trendMap[key].total++;
            if (t.status === 'RESOLVED' || t.status === 'CLOSED') {
                trendMap[key].resolved++;
            }
        }
    });

    const volumeData = Object.entries(trendMap).map(([name, val]) => ({
        name,
        created: val.total,
        resolved: val.resolved
    }));


    // --- 3. Categories Distribution ---
    const ticketsByCategoryRaw = await prisma.ticket.groupBy({
        by: ['category'],
        _count: { category: true }
    });
    const categoryData = ticketsByCategoryRaw.map(c => ({
        name: c.category || "Unassigned",
        value: c._count.category
    })).sort((a, b) => b.value - a.value);


    // --- 4. Department Distribution (based on User) ---
    // Approximate by fetching recent 100 tickets content
    const ticketsDept = await prisma.ticket.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { creator: { select: { department: true } } }
    });
    const deptMap: Record<string, number> = {};
    ticketsDept.forEach(t => {
        const d = t.creator?.department || "Unknown";
        deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const deptData = Object.entries(deptMap)
        .map(([name, val]) => ({ name, value: val }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);


    // --- 5. Top Agents ---
    // Fetch top resolvers
    const topAgentsRaw = await prisma.ticket.groupBy({
        by: ['assigneeId'],
        where: {
            status: { in: ['RESOLVED', 'CLOSED'] },
            assigneeId: { not: null }
        },
        _count: { assigneeId: true },
        orderBy: { _count: { assigneeId: 'desc' } },
        take: 5
    });

    const agentIds = topAgentsRaw.map(a => a.assigneeId).filter(Boolean) as string[];
    const agentDetails = await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, image: true }
    });

    const agentData = topAgentsRaw.map(t => {
        const detail = agentDetails.find(u => u.id === t.assigneeId);
        return {
            name: detail?.name || "Unknown",
            resolved: t._count.assigneeId,
            image: detail?.image
        };
    });


    return (
        <AnalyticsView
            kpi={{
                total: totalTickets,
                open: openTickets,
                resolved: resolvedTickets,
                canceled: canceledTickets,
                avgScore: Number(avgAhp)
            }}
            volumeData={volumeData}
            categoryData={categoryData}
            deptData={deptData}
            agentData={agentData}
            user={{
                name: session.user.name,
                role: session.user.role
            }}
        />
    );
}
