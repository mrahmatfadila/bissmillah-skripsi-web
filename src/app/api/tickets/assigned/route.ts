import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tickets = await prisma.ticket.findMany({
            where: {
                assigneeId: session.user.id,
                status: { not: 'CLOSED' }
            },
            include: {
                creator: { select: { name: true, department: true, image: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
