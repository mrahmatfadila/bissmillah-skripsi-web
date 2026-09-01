import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'MANAGER', 'IT_SUPPORT'].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: "Mohon unggah file format PDF" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use pdf-parse-new which is compatible with Vercel serverless/edge
        const pdfParse = (await import('pdf-parse-new')).default;
        const parsedPdf = await pdfParse(buffer);
        const rawText = parsedPdf.text;

        // Detect month and year
        const monthMap: Record<string, number> = {
            'JANUARI': 0, 'FEBRUARI': 1, 'MARET': 2, 'APRIL': 3, 'MEI': 4, 'JUNI': 5,
            'JULI': 6, 'AGUSTUS': 7, 'SEPTEMBER': 8, 'OKTOBER': 9, 'NOVEMBER': 10, 'DESEMBER': 11
        };

        let targetYear = new Date().getFullYear();
        let targetMonth = new Date().getMonth();

        const headerMatch = rawText.match(/BULAN\s+([A-Z]+)\s+(\d{4})/i);
        if (headerMatch) {
            const mName = headerMatch[1].toUpperCase();
            if (monthMap[mName] !== undefined) targetMonth = monthMap[mName];
            targetYear = parseInt(headerMatch[2], 10);
        }

        // Extract employee rows by matching NIK pattern (10-12 digit numbers)
        const nikPattern = /\b(\d{10,12})\b/g;
        const nikMatches: RegExpExecArray[] = [];
        let match;
        while ((match = nikPattern.exec(rawText)) !== null) {
            nikMatches.push(match);
        }

        if (nikMatches.length === 0) {
            // Fallback: try 6-9 digit employee numbers
            const shortNikPattern = /\b(\d{6,9})\b/g;
            while ((match = shortNikPattern.exec(rawText)) !== null) {
                nikMatches.push(match);
            }
        }

        // List of all valid shift and leave tokens
        const VALID_SHIFT_TOKEN = /^(P|S|M|L|LU|CT|CP|CH|CTB|K|IR|BT|OFF|-)$/i;

        const employeeSchedules: {
            nik: string;
            agentName: string;
            shifts: string[];
        }[] = [];

        for (let i = 0; i < nikMatches.length; i++) {
            const nikMatch = nikMatches[i];
            const nik = nikMatch[1];
            const startIdx = nikMatch.index + nikMatch[0].length;
            const endIdx = i + 1 < nikMatches.length ? nikMatches[i + 1].index : rawText.length;
            const segment = rawText.substring(startIdx, endIdx).replace(/\|/g, ' ').trim();

            const tokens = segment.split(/\s+/).filter(Boolean);

            const nameTokens: string[] = [];
            const shiftTokens: string[] = [];

            for (const token of tokens) {
                const upper = token.toUpperCase();
                if (VALID_SHIFT_TOKEN.test(upper) && shiftTokens.length < 31) {
                    shiftTokens.push(upper);
                } else if (shiftTokens.length === 0 && !/^\d+$/.test(token)) {
                    nameTokens.push(token);
                } else if (shiftTokens.length > 0 && /^\d+$/.test(token)) {
                    break;
                }
            }

            const agentName = nameTokens.join(" ").replace(/\|/g, '').trim();
            if (!agentName || shiftTokens.length === 0) continue;

            employeeSchedules.push({
                nik,
                agentName,
                shifts: shiftTokens,
            });
        }

        // Check if month has 29-31 days but only 28 days were parsed (due to PDF column page-break)
        const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        if (daysInTargetMonth > 28 && employeeSchedules.every(e => e.shifts.length <= 28)) {
            // Find overflow days (e.g. on page 5)
            // Look for pattern "29 30 31" or "29 30" followed by shift tokens
            const overflowMatch = rawText.match(/29\s+30(?:\s+31)?[\s\S]*?(?=(?:Keterangan|Total|$))/i);
            if (overflowMatch) {
                const overflowTokens = overflowMatch[0].split(/\s+/).filter(t => VALID_SHIFT_TOKEN.test(t.toUpperCase()));
                const extraDaysCount = daysInTargetMonth - 28;
                if (overflowTokens.length >= employeeSchedules.length * extraDaysCount) {
                    for (let idx = 0; idx < employeeSchedules.length; idx++) {
                        const start = idx * extraDaysCount;
                        const extraShifts = overflowTokens.slice(start, start + extraDaysCount).map(t => t.toUpperCase());
                        employeeSchedules[idx].shifts.push(...extraShifts);
                    }
                }
            }
        }

        const schedules: any[] = [];
        for (const emp of employeeSchedules) {
            for (let day = 0; day < emp.shifts.length; day++) {
                const code = emp.shifts[day];
                let shiftName = "";
                if (code === "P") shiftName = "PAGI";
                else if (code === "S") shiftName = "SIANG";
                else if (code === "M") shiftName = "MALAM";
                // L, CT, CP, LU, etc. are off/leave days

                if (shiftName) {
                    schedules.push({
                        date: new Date(Date.UTC(targetYear, targetMonth, day + 1)),
                        shift: shiftName,
                        agentName: emp.agentName,
                    });
                }
            }
        }

        if (schedules.length === 0) {
            const preview = rawText.substring(0, 500).replace(/\n/g, ' ');
            return NextResponse.json({
                error: `Tidak ada data shift yang berhasil dibaca. Preview teks: "${preview}"`,
            }, { status: 400 });
        }

        // Upsert each schedule entry
        for (const s of schedules) {
            await prisma.shiftSchedule.upsert({
                where: {
                    date_shift: {
                        date: s.date,
                        shift: s.shift
                    }
                },
                update: {
                    agentName: s.agentName,
                },
                create: {
                    date: s.date,
                    shift: s.shift,
                    agentName: s.agentName,
                }
            });
        }

        return NextResponse.json({
            message: `Jadwal ${Object.keys(monthMap).find(k => monthMap[k] === targetMonth) || ''} ${targetYear} berhasil diimpor! Total entri: ${schedules.length}`,
            importedRows: schedules.length,
        });

    } catch (error: any) {
        console.error("PDF Parsing error:", error);
        return NextResponse.json({ error: error.message || "Gagal memproses PDF" }, { status: 500 });
    }
}
