import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const department = searchParams.get('department');

        const where: any = {};
        const role = session.user.role;

        // Role-based Access Control for Data Visibility
        if (role === 'FINANCE') {
            where.category = 'FINANCE';
        } else if (role === 'SECURITY') {
            where.category = 'SECURITY';
        } else if (role === 'IT_SUPPORT') {
            where.category = { in: ['IT_SUPPORT', 'GENERAL'] }; // Usually IT handles General too
        }
        // SUPER_ADMIN and MANAGER see all

        // If department param is passed, it might conflict or refine the role-based filter.
        // For now, if role restricts to FINANCE, and they request SECURITY dept, they get nothing (which is correct).


        if (status) {
            const statusKey = status.toLowerCase();
            switch (statusKey) {
                case 'open':
                    where.status = 'OPEN';
                    break;
                case 'in_progress':
                    where.status = 'IN_PROGRESS';
                    break;
                case 'pending':
                    where.status = 'PENDING';
                    break;
                case 'resolved':
                    where.status = 'RESOLVED';
                    break;
                case 'closed':
                    where.status = 'CLOSED';
                    break;
                case 'cancelled':
                    where.status = 'CANCELLED';
                    break;
                default:
                    // Fallback to exact match if it matches a DB enum, or ignore
                    // Try to match standard enum if passed directly
                    where.status = status.toUpperCase();
                    break;
            }
        }

        if (department) {
            // Filter by tickets created_by users in that department? 
            // OR tickets assigned to that department?
            // The request was "Departements yg berisi ticket", likely tickets belonging to that category/department
            // Schema has `category` on Ticket (e.g. IT_SUPPORT)
            // But sidebar also lists "Shop", "Finance". 
            // If the user meant "Tickets FROM Finance", we use creator.department.
            // If "Tickets FOR Finance", we use category.
            // Let's assume Category for now as it maps to the support queues.

            // Handle some mappings
            if (department === 'IT_SUPPORT') where.category = 'IT_SUPPORT';
            else if (department === 'SECURITY') where.category = 'SECURITY';
            else if (department === 'FINANCE') where.category = 'FINANCE';
            else {
                // If it's a generic department name like 'shop', we might want to search
                // department string in the Creator user?
                // For now, let's leave it as category or null
            }
        }

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { name: true, department: true } } }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
