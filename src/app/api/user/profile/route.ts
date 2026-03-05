import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';


export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, password, image } = body;

        // Prepare update data
        const updateData: any = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;

        if (image !== undefined) {
            updateData.image = image;
        }

        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
                image: true,
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({
            error: 'Failed to update profile',
            details: error.message || error
        }, { status: 500 });
    }
}
