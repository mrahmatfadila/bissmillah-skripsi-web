import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title, category, content, tags, ticketId } = await request.json();
        const cleanContent = typeof content === 'string' ? content.replace(/&nbsp;/g, ' ') : content;

        const article = await prisma.knowledgeBase.create({
            data: {
                title,
                content: cleanContent,
                category,
                tags: tags || null,
                authorId: session.user.id,
                tickets: ticketId ? {
                    connect: { id: ticketId }
                } : undefined
            }
        });

        return NextResponse.json(article);
    } catch (error) {
        console.error("KB Create Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
