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
        const rows = await prisma.$queryRaw<{ id: string; date: Date; shift: string; agentName: string }[]>`
            SELECT "id", "date", "shift", "agentName"
            FROM "ShiftSchedule"
            WHERE "date" >= ${startDate} AND "date" < ${endDate}
            ORDER BY "date" ASC, 
            CASE "shift" WHEN 'PAGI' THEN 1 WHEN 'SIANG' THEN 2 WHEN 'MALAM' THEN 3 END
        `;

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Schedule view error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
