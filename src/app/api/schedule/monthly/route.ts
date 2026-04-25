import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1)); // 1-based

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1)); // Exclusive

    try {
        const shifts = await prisma.shiftSchedule.findMany({
            where: {
                date: {
                    gte: startDate,
                    lt: endDate
                }
            },
            select: { id: true, date: true, shift: true, agentName: true }
        });

        const shiftOrder: Record<string, number> = { 'PAGI': 1, 'SIANG': 2, 'MALAM': 3 };
        const rows = shifts.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
            return (shiftOrder[a.shift] || 99) - (shiftOrder[b.shift] || 99);
        });

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Schedule view error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
