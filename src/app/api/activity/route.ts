import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch recent comments as activities
        const comments = await prisma.comment.findMany({
            take: 20, // Show only 20 most recent activities
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                ticket: {
                    select: {
                        id: true,
                        ticketNumber: true,
                        title: true
                    }
                }
            }
        });

        // Transform comments to activity format
        const activities = comments.map(comment => ({
            id: comment.id,
            type: 'comment',
            ticketId: comment.ticket.id,
            ticketNumber: comment.ticket.ticketNumber,
            ticketTitle: comment.ticket.title,
            content: comment.content,
            author: {
                name: comment.author.name,
                image: comment.author.image
            },
            createdAt: comment.createdAt.toISOString()
        }));

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
