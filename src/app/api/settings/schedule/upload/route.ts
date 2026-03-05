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

        const schedules: any[] = [];

        for (let i = 0; i < nikMatches.length; i++) {
            const nikMatch = nikMatches[i];
            const startIdx = nikMatch.index + nikMatch[0].length;
            const endIdx = i + 1 < nikMatches.length ? nikMatches[i + 1].index : rawText.length;
            const segment = rawText.substring(startIdx, endIdx).replace(/\|/g, ' ').trim();

            const tokens = segment.split(/\s+/).filter(Boolean);

            const nameTokens: string[] = [];
            const shiftTokens: string[] = [];

            for (const token of tokens) {
                if (/^[PSML]$/.test(token.toUpperCase()) && shiftTokens.length < 31) {
                    shiftTokens.push(token.toUpperCase());
                } else if (shiftTokens.length === 0 && !/^\d+$/.test(token)) {
                    nameTokens.push(token);
                } else if (shiftTokens.length > 0 && /^\d+$/.test(token)) {
                    break;
                }
            }

            const agentName = nameTokens.join(" ").replace(/\|/g, '').trim();
            if (!agentName || shiftTokens.length === 0) continue;

            for (let day = 0; day < shiftTokens.length; day++) {
                const code = shiftTokens[day];
                let shiftName = "";
                if (code === "P") shiftName = "PAGI";
                else if (code === "S") shiftName = "SIANG";
                else if (code === "M") shiftName = "MALAM";
                // L = Libur, skip

                if (shiftName) {
                    schedules.push({
                        date: new Date(Date.UTC(targetYear, targetMonth, day + 1)),
                        shift: shiftName,
                        agentName: agentName,
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
            const now = new Date();
            await prisma.$executeRaw`
                INSERT INTO "ShiftSchedule" ("id", "date", "shift", "agentName", "createdAt", "updatedAt")
                VALUES (
                    ${'sch_' + s.date.getTime() + '_' + s.shift},
                    ${s.date},
                    ${s.shift},
                    ${s.agentName},
                    ${now},
                    ${now}
                )
                ON CONFLICT ("date", "shift")
                DO UPDATE SET "agentName" = EXCLUDED."agentName", "updatedAt" = EXCLUDED."updatedAt"
            `;
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
