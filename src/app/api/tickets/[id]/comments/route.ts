import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { EmailService } from '@/lib/email';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const { content, attachments } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                attachments: attachments || [],
                ticketId: id,
                authorId: session.user.id
            },
            include: {
                author: { select: { id: true, name: true, role: true, image: true } }
            }
        });

        // Fetch ticket to determine who to notify
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            select: { ticketNumber: true, creatorId: true, assigneeId: true, title: true }
        });

        if (ticket) {
            const notifications = [];

            // Notify creator if they are not the one commenting
            if (ticket.creatorId && ticket.creatorId !== session.user.id) {
                notifications.push({
                    userId: ticket.creatorId,
                    title: `New Reply on Ticket #${ticket.ticketNumber}`,
                    message: `${session.user.name} replied: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    type: 'COMMENT',
                    link: `/tickets/${id}`,
                    ticketId: id
                });
            }

            // Notify assignee if they are not the one commenting
            if (ticket.assigneeId && ticket.assigneeId !== session.user.id) {
                notifications.push({
                    userId: ticket.assigneeId,
                    title: `New Reply on Ticket #${ticket.ticketNumber}`,
                    message: `${session.user.name} replied: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    type: 'COMMENT',
                    link: `/tickets/${id}`,
                    ticketId: id
                });
            }

            if (notifications.length > 0) {
                await prisma.notification.createMany({
                    data: notifications
                });
            }

            // Update ticket's updatedAt field
            await prisma.ticket.update({
                where: { id },
                data: { updatedAt: new Date() }
            });

            // Trigger WhatsApp notification for new comment
            WhatsAppService.notifyTicketComment(ticket, session.user.name || "System", content)
                .catch(err => console.error("WA comment error:", err));
            // Trigger Email notification for new comment
            EmailService.notifyTicketComment(ticket, session.user.name || "System", content)
                .catch(err => console.error("Email comment error:", err));
        }

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
