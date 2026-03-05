import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch all tickets with relations
        const tickets = await prisma.ticket.findMany({
            include: {
                creator: { select: { id: true, name: true, department: true } },
                assignee: { select: { id: true, name: true } },
                comments: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const total = tickets.length;

        // ── 1. Completeness Checks ─────────────────────────────
        const noCategory = tickets.filter(t => !t.category || t.category.trim() === '');
        const shortDesc = tickets.filter(t => t.description.trim().length < 20);
        const shortTitle = tickets.filter(t => t.title.trim().length < 5);
        const noAssignee = tickets.filter(t => !t.assigneeId);
        const noComments = tickets.filter(t => t.comments.length === 0);
        const noDept = tickets.filter(t => !t.creator?.department || t.creator.department === 'Unspecified');

        // ── 2. Anomaly Checks ──────────────────────────────────
        // Open tickets older than 7 days (stale)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const staleOpen = tickets.filter(
            t => t.status === 'OPEN' && new Date(t.createdAt) < sevenDaysAgo
        );

        // Resolved but no assignee (data inconsistency)
        const resolvedNoAssignee = tickets.filter(
            t => (t.status === 'RESOLVED' || t.status === 'CLOSED') && !t.assigneeId
        );

        // Very high priority open tickets (critical/high still open > 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const urgentStale = tickets.filter(
            t => (t.priority === 'CRITICAL' || t.priority === 'HIGH')
                && t.status === 'OPEN'
                && new Date(t.createdAt) < threeDaysAgo
        );

        // Duplicate-like titles (same title, different tickets)
        const titleMap: Record<string, number> = {};
        tickets.forEach(t => {
            const key = t.title.toLowerCase().trim();
            titleMap[key] = (titleMap[key] || 0) + 1;
        });
        const duplicateTitles = Object.entries(titleMap)
            .filter(([, count]) => count > 1)
            .map(([title, count]) => ({ title, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // ── 3. Completeness Score ──────────────────────────────
        // Each ticket can score 0–6 points (6 = perfect)
        let totalScore = 0;
        const ticketScores: { id: string; ticketNumber: string; title: string; score: number; issues: string[] }[] = [];

        tickets.forEach(t => {
            let score = 6;
            const issues: string[] = [];

            if (!t.category || t.category.trim() === '') { score--; issues.push('Tidak ada kategori'); }
            if (t.description.trim().length < 20) { score--; issues.push('Deskripsi terlalu pendek'); }
            if (t.title.trim().length < 5) { score--; issues.push('Judul terlalu pendek'); }
            if (!t.assigneeId) { score--; issues.push('Belum ditugaskan'); }
            if (t.comments.length === 0) { score--; issues.push('Tidak ada komentar'); }
            if (!t.creator?.department || t.creator.department === 'Unspecified') {
                score--;
                issues.push('Departemen tidak diketahui');
            }

            totalScore += score;
            if (issues.length > 0) {
                ticketScores.push({
                    id: t.id,
                    ticketNumber: t.ticketNumber,
                    title: t.title,
                    score,
                    issues,
                });
            }
        });

        const avgScore = total > 0 ? (totalScore / total / 6) * 100 : 100;

        // Low quality tickets sorted worst first
        const lowQualityTickets = ticketScores
            .sort((a, b) => a.score - b.score)
            .slice(0, 20);

        // ── 4. Summary per issue type ──────────────────────────
        const issueBreakdown = [
            { label: 'Tanpa Kategori', count: noCategory.length, percentage: total > 0 ? (noCategory.length / total) * 100 : 0, color: '#f59e0b', icon: 'tag' },
            { label: 'Deskripsi Terlalu Pendek', count: shortDesc.length, percentage: total > 0 ? (shortDesc.length / total) * 100 : 0, color: '#8b5cf6', icon: 'file-text' },
            { label: 'Judul Terlalu Pendek', count: shortTitle.length, percentage: total > 0 ? (shortTitle.length / total) * 100 : 0, color: '#ec4899', icon: 'type' },
            { label: 'Belum Ada Teknisi', count: noAssignee.length, percentage: total > 0 ? (noAssignee.length / total) * 100 : 0, color: '#ef4444', icon: 'user-x' },
            { label: 'Tidak Ada Respons', count: noComments.length, percentage: total > 0 ? (noComments.length / total) * 100 : 0, color: '#6b7280', icon: 'message-x' },
            { label: 'Departemen Tidak Diketahui', count: noDept.length, percentage: total > 0 ? (noDept.length / total) * 100 : 0, color: '#0ea5e9', icon: 'building' },
            { label: 'Tiket Terlantar (>7 hari)', count: staleOpen.length, percentage: total > 0 ? (staleOpen.length / total) * 100 : 0, color: '#f97316', icon: 'clock' },
            { label: 'Prioritas Tinggi Terlantar', count: urgentStale.length, percentage: total > 0 ? (urgentStale.length / total) * 100 : 0, color: '#dc2626', icon: 'alert-triangle' },
            { label: 'Selesai tanpa Teknisi', count: resolvedNoAssignee.length, percentage: total > 0 ? (resolvedNoAssignee.length / total) * 100 : 0, color: '#10b981', icon: 'check-circle' },
        ];

        return NextResponse.json({
            summary: {
                total,
                qualityScore: Math.round(avgScore),
                cleanTickets: total - ticketScores.length,
                flaggedTickets: ticketScores.length,
                duplicateTitles: duplicateTitles.length,
            },
            issueBreakdown,
            duplicateTitles,
            lowQualityTickets,
        });
    } catch (error) {
        console.error('[data-quality] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
