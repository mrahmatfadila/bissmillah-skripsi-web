import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { EmailService } from '@/lib/email';

export const dynamic = 'force-dynamic';


export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { assigneeId } = body; // Can be string or null

        // Check permissions: Only Admin/Manager/IT Support can assign
        const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'IT_SUPPORT'];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                assigneeId: assigneeId,
                status: assigneeId ? 'IN_PROGRESS' : 'OPEN', // Auto-update status
                updatedAt: new Date()
            },
            include: {
                assignee: { select: { name: true, email: true } }
            }
        });

        if (updatedTicket.assigneeId && updatedTicket.assignee?.name) {

            // Add internal bell notification
            await prisma.notification.create({
                data: {
                    userId: updatedTicket.assigneeId,
                    title: `Tiket Assigned: #${updatedTicket.ticketNumber}`,
                    message: `Anda mendapat tugas tiket baru dari ${session.user.name || "System"}`,
                    type: "ASSIGNMENT",
                    link: `/tickets/${updatedTicket.id}`,
                    ticketId: updatedTicket.id
                }
            });

            WhatsAppService.notifyTicketAssigned(updatedTicket, updatedTicket.assignee.name, session.user.name || "System")
                .catch(err => console.error("WA assign error:", err));
            EmailService.notifyTicketAssigned(updatedTicket, updatedTicket.assignee.name, session.user.name || "System")
                .catch(err => console.error("Email assign error:", err));
        }

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error('Error assigning ticket:', error);
        return NextResponse.json({ error: 'Failed to assign ticket' }, { status: 500 });
    }
}
