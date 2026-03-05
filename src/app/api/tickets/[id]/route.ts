export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: ticketId } = await context.params;

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                creator: {
                    select: { name: true, email: true, image: true, department: true }
                },
                assignee: {
                    select: { name: true, email: true, image: true }
                },
                comments: {
                    include: {
                        author: {
                            select: { name: true, image: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: ticketId } = await context.params;

        // Verify ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check Permissions
        // Allow: Super Admin, IT Support, Manager, or the Creator of the ticket
        const user = session.user;
        const isAuthorized = user.role === 'SUPER_ADMIN' ||
            user.role === 'IT_SUPPORT' ||
            user.role === 'MANAGER' ||
            ticket.creatorId === user.id;

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Perform Transactional Delete to clean up relations
        await prisma.$transaction([
            // 1. Delete associated notifications
            prisma.notification.deleteMany({
                where: { ticketId: ticketId }
            }),
            // 2. Delete associated comments
            prisma.comment.deleteMany({
                where: { ticketId: ticketId }
            }),
            // 3. Delete the ticket itself
            prisma.ticket.delete({
                where: { id: ticketId }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
