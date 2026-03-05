import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const { title, category, content } = await request.json();

        // Check if article exists and user has permission
        const existingArticle = await prisma.knowledgeBase.findUnique({
            where: { id }
        });

        if (!existingArticle) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const canEdit = session.user.id === existingArticle.authorId ||
            ['IT_SUPPORT', 'SUPER_ADMIN', 'MANAGER'].includes(session.user.role);

        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const article = await prisma.knowledgeBase.update({
            where: { id },
            data: {
                title,
                content,
                category
            }
        });

        return NextResponse.json(article);
    } catch (error) {
        console.error("KB Update Error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
