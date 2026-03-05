import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';


// GET - List all swap requests
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const swaps = await prisma.$queryRaw<any[]>`
            SELECT * FROM "ShiftSwapRequest" ORDER BY "createdAt" DESC
        `;
        return NextResponse.json(swaps);
    } catch (error: any) {
        console.error("GET swap error:", error);
        return NextResponse.json([], { status: 200 });
    }
}

// POST - Create a new swap request
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { requesterName, requesterShift, requesterDate, targetName, targetShift, targetDate, reason } = body;

        if (!requesterName || !requesterShift || !requesterDate || !targetName || !targetShift || !targetDate) {
            return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
        }

        const id = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date();

        await prisma.$executeRaw`
            INSERT INTO "ShiftSwapRequest" 
            ("id", "requesterName", "requesterShift", "requesterDate", "targetName", "targetShift", "targetDate", "reason", "status", "createdAt", "updatedAt")
            VALUES (
                ${id},
                ${requesterName},
                ${requesterShift},
                ${new Date(requesterDate)},
                ${targetName},
                ${targetShift},
                ${new Date(targetDate)},
                ${reason || null},
                'PENDING',
                ${now},
                ${now}
            )
        `;

        return NextResponse.json({ message: "Permintaan tukar shift berhasil diajukan!" }, { status: 201 });
    } catch (error: any) {
        console.error("POST swap error:", error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan permintaan" }, { status: 500 });
    }
}
