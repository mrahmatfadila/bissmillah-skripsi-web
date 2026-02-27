
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationId, all, ticketId } = body;

        if (all) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true }
            });
        } else if (ticketId) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, ticketId: ticketId, read: false },
                data: { read: true }
            });
        } else if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { read: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
