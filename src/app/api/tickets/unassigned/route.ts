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

        const role = session.user.role;
        let categoryFilter = {};

        // Define category filters based on role
        if (role === 'IT_SUPPORT') {
            categoryFilter = { category: 'IT_SUPPORT' };
        } else if (role === 'SECURITY') {
            categoryFilter = { category: 'SECURITY' };
        } else if (role === 'FINANCE') {
            categoryFilter = { category: 'FINANCE' };
        }
        // SUPER_ADMIN and MANAGER might see all or specific logic, 
        // but for now let's adhere to the request of showing based on "report ke siapa"
        // If SUPER_ADMIN, maybe show all?
        else if (role === 'SUPER_ADMIN') {
            // No category filter, see all unassigned
            categoryFilter = {};
        } else {
            // Other roles shouldn't see unassigned tickets typically, or strict filter
            return NextResponse.json([]);
        }

        const tickets = await prisma.ticket.findMany({
            where: {
                assigneeId: null, // Unassigned
                status: { not: 'CLOSED' }, // Only active tickets
                ...categoryFilter,
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        department: true,
                        location: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Error fetching unassigned tickets:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}
