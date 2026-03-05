import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

/**
 * P (Pagi)  = 06:00 - 15:00
 * S (Siang) = 13:30 - 22:30
 * M (Malam) = 21:30 - 06:30 next day
 */
function getActiveShifts(now: Date): { shift: string; date: Date }[] {
    const h = now.getUTCHours();
    const m = now.getUTCMinutes();
    const totalMinutes = h * 60 + m;

    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

const SHIFT_LABEL: Record<string, string> = {
    PAGI: "Pagi (06:00–15:00)",
    SIANG: "Siang (13:30–22:30)",
    MALAM: "Malam (21:30–06:30)",
};

export async function GET(request: Request) {
    try {
        // Vercel servers run on UTC. Convert to Indonesia WIB timezone (UTC+7) for Jakarta.
        const nowUTC = new Date();
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
        const nowWIB = new Date(nowUTC.getTime() + WIB_OFFSET_MS);

        const activeShifts = getActiveShifts(nowWIB);

        // No shift window active right now (e.g. before 06:00 or brief overlap gaps)
        if (activeShifts.length === 0) {
            return NextResponse.json({
                agentName: null,
                activeShiftName: null,
                noScheduleUploaded: false,
                message: "Di luar jam shift",
            });
        }

        // The "primary" shift = most specific (last added)
        const primaryShift = activeShifts[activeShifts.length - 1].shift;

        // Check if ANY schedule exists in DB at all
        const totalScheduleCount = await prisma.shiftSchedule.count();
        const noScheduleUploaded = totalScheduleCount === 0;

        // Try from most specific to least specific
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
                return NextResponse.json({
                    ...rows[0],
                    shiftLabel: SHIFT_LABEL[shift] ?? shift,
                    activeShiftName: shift,
                    noScheduleUploaded: false,
                });
            }
        }

        // Shift window is active but no agent found
        return NextResponse.json({
            agentName: null,
            activeShiftName: primaryShift,
            shiftLabel: SHIFT_LABEL[primaryShift] ?? primaryShift,
            noScheduleUploaded,
            message: noScheduleUploaded ? "Jadwal belum diunggah" : "Tidak ada petugas terjadwal",
        });

    } catch (error: any) {
        console.error("Live schedule error:", error);
        return NextResponse.json({ error: "Gagal mengambil data jadwal" }, { status: 500 });
    }
}
