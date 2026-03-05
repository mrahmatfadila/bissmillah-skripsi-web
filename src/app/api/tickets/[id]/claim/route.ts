export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if ticket is already assigned
        const ticket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        if (ticket.assigneeId) {
            return NextResponse.json({ error: 'Ticket is already assigned' }, { status: 400 });
        }

        // Assign to current user
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                assigneeId: session.user.id,
                status: 'IN_PROGRESS', // Auto move to in progress? Or keep OPEN? Usually claim -> In Progress
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error('Error claiming ticket:', error);
        return NextResponse.json({ error: 'Failed to claim ticket' }, { status: 500 });
    }
}
