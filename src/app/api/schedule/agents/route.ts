import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';




// GET: Return list of IT Support agent names from schedule
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json([], { status: 401 });

    try {
        // Get distinct agent names from ShiftSchedule
        const rows = await prisma.$queryRaw<{ agentName: string }[]>`
            SELECT DISTINCT "agentName" FROM "ShiftSchedule"
            ORDER BY "agentName" ASC
        `;
        const names = rows.map(r => r.agentName);
        return NextResponse.json(names);
    } catch {
        return NextResponse.json([]);
    }
}
