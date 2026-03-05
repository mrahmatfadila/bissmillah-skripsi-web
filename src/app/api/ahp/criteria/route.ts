import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';




export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        // Allow all authenticated users to read criteria (needed for ticket creation form)
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
        // Only IT Support, Manager, or Super Admin should probably touch this, adhering to strict rules: Super Admin only for settings usually.
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { criteria } = body; // Expect array of { name, weight }

        if (!Array.isArray(criteria)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Transaction to update all
        await prisma.$transaction(async (tx) => {
            // Clear existing? Or update/upsert.
            // Let's delete all and recreate to ensure clean slate matching the AHP matrix result
            await tx.aHPCriteria.deleteMany({});

            await tx.aHPCriteria.createMany({
                data: criteria.map((c: any) => ({
                    name: c.name,
                    weight: parseFloat(c.weight)
                }))
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving AHP criteria:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
