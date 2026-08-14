import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';


export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        // Only Super Admin can update users
        if (!session || session.user.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { nik, name, email, password, role, department, location } = body;

        // Prepare update data
        const updateData: any = {
            nik,
            name,
            email: email || null,
            role,
            department: department || null,
            location: location || 'Terminal 2',
        };

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                nik: true,
                name: true,
                email: true,
                role: true,
                department: true,
                location: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        // Only Super Admin can delete users
        if (!session || session.user.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Prevent deleting yourself
        if (session.user.id === params.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Articles unlinking & deleting
            const userArticles = await tx.knowledgeBase.findMany({
                where: { authorId: params.id },
                select: { id: true }
            });
            const articleIds = userArticles.map(a => a.id);
            if (articleIds.length > 0) {
                await tx.ticket.updateMany({
                    where: { kbArticleId: { in: articleIds } },
                    data: { kbArticleId: null }
                });
                await tx.knowledgeBase.deleteMany({
                    where: { id: { in: articleIds } }
                });
            }

            // 2. Tickets created by the user
            const createdTickets = await tx.ticket.findMany({
                where: { creatorId: params.id },
                select: { id: true }
            });
            const createdTicketIds = createdTickets.map(t => t.id);
            if (createdTicketIds.length > 0) {
                await tx.comment.deleteMany({
                    where: { ticketId: { in: createdTicketIds } }
                });
                await tx.notification.deleteMany({
                    where: { ticketId: { in: createdTicketIds } }
                });
                await tx.ticket.deleteMany({
                    where: { id: { in: createdTicketIds } }
                });
            }

            // 3. Tickets assigned to the user
            await tx.ticket.updateMany({
                where: { assigneeId: params.id },
                data: { assigneeId: null }
            });

            // 4. Comments written by the user on other tickets
            await tx.comment.deleteMany({
                where: { authorId: params.id }
            });

            // 5. Notifications sent to the user
            await tx.notification.deleteMany({
                where: { userId: params.id }
            });

            // 6. Finally delete the user
            await tx.user.delete({
                where: { id: params.id }
            });
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
