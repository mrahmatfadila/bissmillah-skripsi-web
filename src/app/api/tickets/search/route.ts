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
        const status = searchParams.get('status');
        const department = searchParams.get('department');

        const where: any = {};
        
        // Link Status menu to Tugas Saya (Assigned tickets)
        where.assigneeId = session.user.id;

        if (status) {
            const statusKey = status.toLowerCase();
            switch (statusKey) {
                case 'open':
                    where.status = 'OPEN';
                    break;
                case 'in_progress':
                    where.status = 'IN_PROGRESS';
                    break;
                case 'pending':
                    where.status = 'PENDING';
                    break;
                case 'resolved':
                    where.status = 'RESOLVED';
                    break;
                case 'closed':
                    where.status = 'CLOSED';
                    break;
                case 'cancelled':
                    where.status = 'CANCELLED';
                    break;
                default:
                    where.status = status.toUpperCase();
                    break;
            }
        }

        if (department) {
            if (department === 'IT_SUPPORT') where.category = 'IT_SUPPORT';
            else if (department === 'SECURITY') where.category = 'SECURITY';
            else if (department === 'FINANCE') where.category = 'FINANCE';
        }

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { name: true, department: true } } }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
