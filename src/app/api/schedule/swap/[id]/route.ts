import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';


// PATCH - Approve or Reject swap
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "MANAGER", "IT_SUPPORT"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { action } = await req.json();
        const { id } = await props.params;

        // Fetch swap request via raw SQL
        const rows = await prisma.$queryRaw<any[]>`
            SELECT * FROM "ShiftSwapRequest" WHERE "id" = ${id} LIMIT 1
        `;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
        }

        const swapReq = rows[0];

        if (swapReq.status !== "PENDING") {
            return NextResponse.json({ error: "Permintaan ini sudah diproses sebelumnya" }, { status: 400 });
        }

        const approvedBy = session.user.name || session.user.email || "Admin";
        const now = new Date();

        if (action === "APPROVED") {
            // Perform the actual schedule swap
            const startOfRequesterDate = new Date(swapReq.requesterDate);
            startOfRequesterDate.setHours(0, 0, 0, 0);
            const endOfRequesterDate = new Date(startOfRequesterDate.getTime() + 86400000);

            const startOfTargetDate = new Date(swapReq.targetDate);
            startOfTargetDate.setHours(0, 0, 0, 0);
            const endOfTargetDate = new Date(startOfTargetDate.getTime() + 86400000);

            // Swap agent names in ShiftSchedule
            await prisma.$executeRaw`
                UPDATE "ShiftSchedule"
                SET "agentName" = ${swapReq.targetName}, "updatedAt" = ${now}
                WHERE "date" >= ${startOfRequesterDate} AND "date" < ${endOfRequesterDate}
                AND "shift" = ${swapReq.requesterShift}
                AND "agentName" = ${swapReq.requesterName}
            `;

            await prisma.$executeRaw`
                UPDATE "ShiftSchedule"
                SET "agentName" = ${swapReq.requesterName}, "updatedAt" = ${now}
                WHERE "date" >= ${startOfTargetDate} AND "date" < ${endOfTargetDate}
                AND "shift" = ${swapReq.targetShift}
                AND "agentName" = ${swapReq.targetName}
            `;

            // Update swap request status to APPROVED
            await prisma.$executeRaw`
                UPDATE "ShiftSwapRequest"
                SET "status" = 'APPROVED', "approvedBy" = ${approvedBy}, "approvedAt" = ${now}, "updatedAt" = ${now}
                WHERE "id" = ${id}
            `;

            return NextResponse.json({ message: "✅ Tukar shift disetujui! Jadwal telah diperbarui otomatis." });
        }

        if (action === "REJECTED") {
            await prisma.$executeRaw`
                UPDATE "ShiftSwapRequest"
                SET "status" = 'REJECTED', "approvedBy" = ${approvedBy}, "approvedAt" = ${now}, "updatedAt" = ${now}
                WHERE "id" = ${id}
            `;
            return NextResponse.json({ message: "Permintaan tukar shift ditolak." });
        }

        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });

    } catch (error: any) {
        console.error("PATCH swap error:", error);
        return NextResponse.json({ error: error.message || "Gagal memproses permintaan" }, { status: 500 });
    }
}
