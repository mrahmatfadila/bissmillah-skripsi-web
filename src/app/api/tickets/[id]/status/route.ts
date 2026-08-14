import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { EmailService } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const { status } = await request.json();

        // Valid statuses
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const existingTicket = await prisma.ticket.findUnique({ where: { id } });
        if (!existingTicket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status, updatedAt: new Date() }
        });

        if (existingTicket.status !== status) {
            const statusNotifications = [];

            // Notify creator if they are not the one changing status
            if (existingTicket.creatorId && existingTicket.creatorId !== session.user.id) {
                statusNotifications.push({
                    userId: existingTicket.creatorId,
                    title: `Status Tiket Berubah: #${ticket.ticketNumber}`,
                    message: `Status tiket Anda diubah dari ${existingTicket.status} menjadi ${status} oleh ${session.user.name || "System"}`,
                    type: "STATUS_CHANGE",
                    link: `/tickets/${ticket.id}`,
                    ticketId: ticket.id
                });
            }

            // Notify assignee if they exist and are not the one changing status
            if (existingTicket.assigneeId && existingTicket.assigneeId !== session.user.id) {
                statusNotifications.push({
                    userId: existingTicket.assigneeId,
                    title: `Status Tiket Berubah: #${ticket.ticketNumber}`,
                    message: `Status tiket yang ditugaskan kepada Anda diubah dari ${existingTicket.status} menjadi ${status} oleh ${session.user.name || "System"}`,
                    type: "STATUS_CHANGE",
                    link: `/tickets/${ticket.id}`,
                    ticketId: ticket.id
                });
            }

            if (statusNotifications.length > 0) {
                await prisma.notification.createMany({
                    data: statusNotifications
                });
            }

            WhatsAppService.notifyTicketStatusChange(ticket, existingTicket.status, status, session.user.name || "System")
                .catch(err => console.error("WA status error:", err));
            EmailService.notifyTicketStatusChange(ticket, existingTicket.status, status, session.user.name || "System")
                .catch(err => console.error("Email status error:", err));
        }

        // Optional: Log status change in a separate table if needed, or add system comment
        await prisma.comment.create({
            data: {
                content: `Status changed to ${status}`,
                ticketId: id,
                authorId: session.user.id
            }
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Error updating status:", error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
