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

        const messages = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                read: false,
                type: 'COMMENT'
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                ticket: {
                    select: { id: true, title: true, ticketNumber: true }
                }
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
