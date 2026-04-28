import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const criteria = await prisma.aHPCriteria.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(criteria);
    } catch (error) {
        console.error('Error fetching AHP criteria:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { criteria } = body;

        if (!Array.isArray(criteria)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.aHPCriteria.deleteMany({});
            await tx.aHPCriteria.createMany({
                data: criteria.map((c: any) => ({
                    name: c.name,
                    weight: parseFloat(c.weight),
                    description: c.description || null
                }))
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving AHP criteria:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
