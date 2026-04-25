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

        const swapReq = await prisma.shiftSwapRequest.findUnique({
            where: { id: id }
        });

        if (!swapReq) {
            return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
        }

        if (swapReq.status !== "PENDING") {
            return NextResponse.json({ error: "Permintaan ini sudah diproses sebelumnya" }, { status: 400 });
        }

        const approvedBy = session.user.name || session.user.email || "Admin";
        const now = new Date();

        if (action === "APPROVED") {
            const startOfRequesterDate = new Date(swapReq.requesterDate);
            startOfRequesterDate.setHours(0, 0, 0, 0);
            const endOfRequesterDate = new Date(startOfRequesterDate.getTime() + 86400000);

            const startOfTargetDate = new Date(swapReq.targetDate);
            startOfTargetDate.setHours(0, 0, 0, 0);
            const endOfTargetDate = new Date(startOfTargetDate.getTime() + 86400000);

            // Swap agent names in ShiftSchedule
            await prisma.shiftSchedule.updateMany({
                where: {
                    date: {
                        gte: startOfRequesterDate,
                        lt: endOfRequesterDate
                    },
                    shift: swapReq.requesterShift,
                    agentName: swapReq.requesterName
                },
                data: {
                    agentName: swapReq.targetName
                }
            });

            await prisma.shiftSchedule.updateMany({
                where: {
                    date: {
                        gte: startOfTargetDate,
                        lt: endOfTargetDate
                    },
                    shift: swapReq.targetShift,
                    agentName: swapReq.targetName
                },
                data: {
                    agentName: swapReq.requesterName
                }
            });

            // Update swap request status to APPROVED
            await prisma.shiftSwapRequest.update({
                where: { id: id },
                data: {
                    status: 'APPROVED',
                    approvedBy: approvedBy,
                    approvedAt: now
                }
            });

            return NextResponse.json({ message: "✅ Tukar shift disetujui! Jadwal telah diperbarui otomatis." });
        }

        if (action === "REJECTED") {
            await prisma.shiftSwapRequest.update({
                where: { id: id },
                data: {
                    status: 'REJECTED',
                    approvedBy: approvedBy,
                    approvedAt: now
                }
            });
            return NextResponse.json({ message: "Permintaan tukar shift ditolak." });
        }

        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });

    } catch (error: any) {
        console.error("PATCH swap error:", error);
        return NextResponse.json({ error: error.message || "Gagal memproses permintaan" }, { status: 500 });
    }
}
