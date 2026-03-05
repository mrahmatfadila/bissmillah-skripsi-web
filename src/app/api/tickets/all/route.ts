import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.user.role;
        const where: any = {};

        // Role-based visibility
        // If not admin/support, maybe limit what they see in "All"?
        // Assuming "All Tickets" for checking all history or team tickets.
        if (role === 'STAFF') {
            // Staff usually only sees their own, but if they have "All Tickets" link, maybe it's department based?
            // For safety, let's keep it to creator/assignee for Staff unless specified otherwise.
            // However, user asked for "Semua Tiket" and has permissions.
            // Let's assume broad read access for now if they have the link, 
            // BUT filtered by role if necessary. 
            // Given the prompt context, I'll allow seeing all tickets but maybe limit edits in UI.
        }

        // Actually, let's just return all tickets for now to satisfy the "Semua Tiket" list.
        // Prisma will handle standard query.

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { name: true, image: true, department: true } },
                assignee: { select: { name: true, image: true } },
                _count: { select: { comments: true } }
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
