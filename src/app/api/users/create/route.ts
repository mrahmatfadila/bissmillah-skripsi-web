export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Only Super Admin can create users
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { nik, name, email, password, role, department, location } = body;

        // Validate required fields
        if (!nik || !name || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if NIK already exists
        const existingUser = await prisma.user.findUnique({
            where: { nik },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'NIK already exists' }, { status: 400 });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (existingEmail) {
                return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                nik,
                name,
                email: email || null,
                password: hashedPassword,
                role,
                department: department || null,
                location: location || 'Kantor Jakarta',
            },
            select: {
                id: true,
                nik: true,
                name: true,
                email: true,
                role: true,
                department: true,
                location: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
