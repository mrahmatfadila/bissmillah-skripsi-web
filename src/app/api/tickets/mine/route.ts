import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tickets = await prisma.ticket.findMany({
            where: {
                creatorId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                ticketNumber: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                category: true,
                createdAt: true,
                _count: {
                    select: { comments: true }
                }
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
