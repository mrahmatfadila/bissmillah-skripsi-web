import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CongratulationsCard } from "@/components/dashboard/congratulations-card";
import { MiniStatCard } from "@/components/dashboard/mini-stat-card";
import { ActiveTicketsList } from "@/components/dashboard/active-tickets-list";
import { TotalTicketsChart } from "@/components/dashboard/total-tickets-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { CustomerSatisfactionCard } from "@/components/dashboard/customer-satisfaction-card";
import { AgentsLeadership } from "@/components/dashboard/agents-leadership";
import { TopDepartmentsChart } from "@/components/dashboard/top-departments-chart";
import { IssueTable } from "@/components/dashboard/issue-table";
import { Clock, Send } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    const allowedRoles = ['SUPER_ADMIN', 'IT_SUPPORT', 'MANAGER'];
    if (!role || !allowedRoles.includes(role)) {
        redirect('/tickets/mine');
    }

    // 1. Basic Counts
    const totalTickets = await prisma.ticket.count();
    const myTickets = await prisma.ticket.count({
        where: { assigneeId: session.user.id }
    });
    const myResolvedTickets = await prisma.ticket.count({
        where: { assigneeId: session.user.id, status: 'RESOLVED' }
    });

    // 2. Recent Tickets - Fetch more for pagination
    const recentTickets = await prisma.ticket.findMany({
        take: 20, // Fetch 20 tickets for pagination (4 pages of 5)
        orderBy: { createdAt: 'desc' },
        include: {
            creator: { select: { name: true, department: true, image: true } },
            assignee: { select: { name: true, role: true, image: true } }
        }
    });

    // 3. Status Distribution
    const ticketsByStatusRaw = await prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true }
    });

    const statusColors: any = {
        'OPEN': '#3b82f6',
        'IN_PROGRESS': '#f59e0b',
        'RESOLVED': '#10b981',
        'CLOSED': '#6b7280',
        'PENDING': '#8b5cf6',
        'CANCELLED': '#ef4444'
    };

    const ticketsByStatus = ticketsByStatusRaw.map(item => ({
        name: item.status.replace(/_/g, " "),
        value: item._count.status,
        color: statusColors[item.status] || '#cbd5e1'
    }));

    // 4. Priority Distribution
    const ticketsByPriorityRaw = await prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true }
    });

    // Ensure accurate order
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const ticketsByPriority = priorityOrder.map(p => {
        const found = ticketsByPriorityRaw.find(item => item.priority === p);
        return { name: p, value: found ? found._count.priority : 0 };
    }).filter(i => i.value > 0);


    // 5. Top Agents (Resolved Count - Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topAgentsRaw = await prisma.ticket.groupBy({
        by: ['assigneeId'],
        where: {
            assigneeId: { not: null },
            updatedAt: { gte: thirtyDaysAgo },
            status: { in: ['RESOLVED', 'CLOSED'] }
        },
        _count: {
            assigneeId: true
        },
        orderBy: {
            _count: {
                assigneeId: 'desc'
            }
        },
        take: 5
    });

    // Fetch user details
    const agentIds = topAgentsRaw.map(a => a.assigneeId).filter(Boolean) as string[];
    const agentsDetails = await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, email: true, image: true }
    });

    const topAgents = topAgentsRaw.map(item => {
        const detail = agentsDetails.find(u => u.id === item.assigneeId);
        return {
            name: detail?.name || "Unknown",
            email: detail?.email || "",
            image: detail?.image || null,
            count: item._count.assigneeId
        };
    });

    // 6. Department Stats
    // We need to aggregate tickets by creator's department
    // Since we can't groupBy relation, we fetch user department counts effectively.
    // Actually, simpler: Group users by department, and count assuming 1 user = N tickets?
    // No. Accurate way: Fetch all tickets with select creator.department (heavy).
    // Optimization: GroupBy on User (department) is for USERS per dept, not tickets.
    // Let's stick to the "User Department" approximation for now or fetch aggregated if not too heavy.
    // For now, let's just fetch Ticket counts by Department via raw query or simple aggregation if dataset is small.
    // Given the constraints and likely small dataset for now, let's do:
    const deptTickets = await prisma.ticket.findMany({
        select: {
            creator: {
                select: { department: true }
            }
        }
    });

    const deptMap: Record<string, number> = {};
    deptTickets.forEach(t => {
        const d = t.creator?.department || "Unspecified";
        deptMap[d] = (deptMap[d] || 0) + 1;
    });

    const deptData = Object.entries(deptMap)
        .map(([name, value]) => ({
            name,
            value,
            fill: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color for now or map specific
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Fix Department Colors
    const deptColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    deptData.forEach((d, i) => d.fill = deptColors[i % deptColors.length]);


    // 7. Trend Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTrend = await prisma.ticket.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
    });

    // Bucket by day
    const trendMap: Record<string, number> = {};
    recentTrend.forEach(t => {
        const day = t.createdAt.toISOString().split('T')[0];
        trendMap[day] = (trendMap[day] || 0) + 1;
    });

    // Convert to array expected by sparkline
    const trendData = Object.values(trendMap).map(v => ({ value: v }));
    // Fill with previous mock if empty to avoid broken UI, or just empty
    const finalTrendData = trendData.length > 0 ? trendData : [{ value: 0 }, { value: 0 }, { value: 0 }];


    // 8. Performance Metrics Calculation

    // A. Average Resolution Time (Sample based)
    const resolvedTicketsMetrics = await prisma.ticket.findMany({
        where: {
            status: { in: ['RESOLVED', 'CLOSED'] }
        },
        select: {
            createdAt: true,
            updatedAt: true
        },
        take: 50,
        orderBy: { updatedAt: 'desc' }
    });

    let resolutionTimeStr = "0 Jam";

    if (resolvedTicketsMetrics.length > 0) {
        const totalResolutionTime = resolvedTicketsMetrics.reduce((acc, t) => {
            return acc + (t.updatedAt.getTime() - t.createdAt.getTime());
        }, 0);

        const avgMs = totalResolutionTime / resolvedTicketsMetrics.length;
        const avgHours = avgMs / (1000 * 60 * 60);

        if (avgHours < 1) {
            resolutionTimeStr = `${Math.round(avgMs / (1000 * 60))} Menit`;
        } else if (avgHours < 24) {
            resolutionTimeStr = `${Math.round(avgHours)} Jam`;
        } else {
            resolutionTimeStr = `${Math.round(avgHours / 24)} Hari`;
        }
    }

    // B. Average Response Speed (Sample based)
    const responseMetrics = await prisma.ticket.findMany({
        where: {
            comments: { some: {} } // Tickets with comments
        },
        select: {
            createdAt: true,
            creatorId: true,
            comments: {
                take: 5, // Check first few to find non-author comment
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true, authorId: true }
            }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
    });

    let responseTimeStr = "0 Menit";
    let totalResponseTime = 0;
    let responseCount = 0;

    responseMetrics.forEach(t => {
        // Find first comment not by creator
        const firstResponse = t.comments.find(c => c.authorId !== t.creatorId);
        if (firstResponse) {
            const diff = firstResponse.createdAt.getTime() - t.createdAt.getTime();
            if (diff > 0) {
                totalResponseTime += diff;
                responseCount++;
            }
        }
    });

    if (responseCount > 0) {
        const avgRespMs = totalResponseTime / responseCount;
        const avgRespHours = avgRespMs / (1000 * 60 * 60);

        if (avgRespHours < 1) {
            responseTimeStr = `${Math.max(1, Math.round(avgRespMs / (1000 * 60)))} Menit`;
        } else {
            responseTimeStr = `${Math.round(avgRespHours)} Jam`;
        }
    }


    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/20 pb-10">
            <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

                {/* Section 1: Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <MiniStatCard
                        title="Total Tiket"
                        value={totalTickets.toString()}
                        trend="7 Hari Terakhir"
                        trendUp={true} // Dynamic trend calculation skipped for simplicity
                        data={finalTrendData}
                        color="#3b82f6"
                    />
                    <MiniStatCard
                        title="Tugas Saya"
                        value={myTickets.toString()}
                        trend="Aktif"
                        trendUp={true}
                        data={[{ value: myTickets }]} // simple visual
                        color="#8b5cf6"
                    />
                    <div className="md:col-span-2">
                        <CongratulationsCard
                            user={{
                                name: session.user.name,
                                role: session.user.role,
                                image: session.user.image
                            }}
                            stats={{
                                assigned: myTickets,
                                resolved: myResolvedTickets
                            }}
                        />
                    </div>
                </div>

                {/* Section 2: Middle Content */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* Left Column: Active Tickets (Wider) */}
                    <div className="xl:col-span-8 h-full">
                        <ActiveTicketsList tickets={recentTickets} />
                    </div>

                    {/* Right Column: Charts & Stats (Narrower) */}
                    <div className="xl:col-span-4 space-y-6 flex flex-col h-full">
                        {/* Pie Chart */}
                        <div className="flex-1 min-h-[300px]">
                            <TotalTicketsChart data={ticketsByStatus} />
                        </div>

                        {/* Two Small Colored Cards */}
                        <div className="grid grid-cols-2 gap-4 h-[180px]">
                            <StatCard
                                title="Waktu Penyelesaian"
                                value={resolutionTimeStr}
                                subValue="Rata-rata"
                                gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
                                icon={<Clock size={60} />}
                            />
                            <StatCard
                                title="Kecepatan Respon"
                                value={responseTimeStr}
                                subValue="Rata-rata"
                                gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                                icon={<Send size={60} />}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Issue List Table */}
                <div>
                    <IssueTable tickets={recentTickets} totalCount={totalTickets} />
                </div>

                {/* Section 3: Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 h-[320px]">
                        <CustomerSatisfactionCard data={ticketsByPriority} />
                    </div>
                    <div className="md:col-span-1 h-[320px]">
                        <AgentsLeadership agents={topAgents} />
                    </div>
                    <div className="md:col-span-1 h-[320px]">
                        <TopDepartmentsChart data={deptData} />
                    </div>
                </div>

            </div>
        </div>
    );
}
