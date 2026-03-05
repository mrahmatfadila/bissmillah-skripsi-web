import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';




/**
 * P (Pagi)  = 06:00 - 15:00
 * S (Siang) = 13:30 - 22:30
 * M (Malam) = 21:30 - 06:30 next day
 */
function getActiveShifts(now: Date): { shift: string; date: Date }[] {
    const h = now.getHours();
    const m = now.getMinutes();
    const totalMinutes = h * 60 + m;

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

    const results: { shift: string; date: Date }[] = [];

    // Pagi: 06:00 (360) - 15:00 (900)
    if (totalMinutes >= 360 && totalMinutes < 900) {
        results.push({ shift: "PAGI", date: startOfToday });
    }
    // Siang: 13:30 (810) - 22:30 (1350)
    if (totalMinutes >= 810 && totalMinutes < 1350) {
        results.push({ shift: "SIANG", date: startOfToday });
    }
    // Malam after 21:30 → belongs to TODAY
    if (totalMinutes >= 1290) {
        results.push({ shift: "MALAM", date: startOfToday });
    }
    // Malam before 06:30 → belongs to YESTERDAY
    if (totalMinutes < 390) {
        results.push({ shift: "MALAM", date: startOfYesterday });
    }

    return results;
}

export async function GET() {
    try {
        const now = new Date();
        const activeShifts = getActiveShifts(now);

        if (activeShifts.length === 0) {
            return NextResponse.json({ agentName: null, message: "Tidak ada shift aktif saat ini" });
        }

        // Try from most specific (last in array) to first
        for (let i = activeShifts.length - 1; i >= 0; i--) {
            const { shift, date } = activeShifts[i];
            const endOfDay = new Date(date.getTime() + 86400000);

            const rows = await prisma.$queryRaw<any[]>`
                SELECT * FROM "ShiftSchedule"
                WHERE "date" >= ${date} AND "date" < ${endOfDay}
                AND "shift" = ${shift}
                LIMIT 1
            `;

            if (rows && rows.length > 0) {
                const schedule = rows[0];
                return NextResponse.json({
                    ...schedule,
                    shiftLabel:
                        shift === "PAGI" ? "Pagi (06:00–15:00)" :
                            shift === "SIANG" ? "Siang (13:30–22:30)" :
                                "Malam (21:30–06:30)",
                });
            }
        }

        return NextResponse.json({ agentName: null, message: "Jadwal hari ini belum diisi" });

    } catch (error: any) {
        console.error("Live schedule error:", error);
        return NextResponse.json({ error: "Gagal mengambil data jadwal" }, { status: 500 });
    }
}
