export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: ticketId } = await context.params;

        const isPrivileged = ['SUPER_ADMIN', 'IT_SUPPORT', 'MANAGER', 'MANAGER_IT'].includes(session.user.role);

        // Restore ticket by changing status from CANCELLED to OPEN
        // Use conditional where clause for security
        const ticket = await prisma.ticket.update({
            where: {
                id: ticketId,
                ...(isPrivileged ? {} : { creatorId: session.user.id })
            },
            data: {
                status: 'OPEN'
            }
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error restoring ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
