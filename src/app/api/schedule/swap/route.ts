import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmailService } from "@/lib/email";

export const dynamic = 'force-dynamic';


// GET - List all swap requests
export async function GET(request: Request) {
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

        try {
            const targetUser = await prisma.user.findFirst({
                where: { name: { contains: targetName, mode: 'insensitive' } }
            });

            if (targetUser) {
                const targetDateStr = new Date(targetDate).toLocaleDateString('id-ID', { dateStyle: 'full' });
                const requesterDateStr = new Date(requesterDate).toLocaleDateString('id-ID', { dateStyle: 'full' });

                await prisma.notification.create({
                    data: {
                        userId: targetUser.id,
                        title: `Tukar Shift: ${requesterName}`,
                        message: `${requesterName} ingin menukar shift ${targetShift} Anda (${targetDateStr}) dengan shift ${requesterShift} (${requesterDateStr}).`,
                        type: "SYSTEM",
                        link: `/dashboard/settings/schedule/swap`
                    }
                });

                if (targetUser.email) {
                    EmailService.notifyShiftSwapRequest(
                        targetUser.email,
                        targetUser.name || targetName,
                        requesterName,
                        `${targetShift} - ${targetDateStr}`,
                        `${requesterShift} - ${requesterDateStr}`
                    ).catch(err => console.error("Email swap error:", err));
                }
            }
        } catch (notifErr) {
            console.error("Error sending swap notification:", notifErr);
        }

        return NextResponse.json({ message: "Permintaan tukar shift berhasil diajukan!" }, { status: 201 });
    } catch (error: any) {
        console.error("POST swap error:", error);
        return NextResponse.json({ error: error.message || "Gagal menyimpan permintaan" }, { status: 500 });
    }
}
