"use client";

import { useEffect, useState } from "react";
import { Clock, UserCheck, AlertCircle, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ShiftData {
    shift?: string;
    shiftLabel?: string;
    agentName?: string | null;
    activeShiftName?: string | null;
    noScheduleUploaded?: boolean;
    message?: string;
}

const SHIFT_STYLES: Record<string, { bg: string; icon: string }> = {
    PAGI: { bg: "bg-gradient-to-r from-amber-500 to-orange-400", icon: "🌅" },
    SIANG: { bg: "bg-gradient-to-r from-blue-600 to-indigo-500", icon: "☀️" },
    MALAM: { bg: "bg-gradient-to-r from-purple-800 to-slate-900", icon: "🌙" },
};

const SHIFT_NAME_ID: Record<string, string> = {
    PAGI: "Pagi",
    SIANG: "Siang",
    MALAM: "Malam",
};

export function LiveShiftBanner() {
    const [shiftData, setShiftData] = useState<ShiftData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchShift = async () => {
        try {
            const res = await fetch("/api/schedule/live", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setShiftData(data);
            }
        } catch { setShiftData(null); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchShift();
        const shiftTimer = setInterval(fetchShift, 60_000);
        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => { clearInterval(shiftTimer); clearInterval(clockTimer); };
    }, []);

    if (loading) return null;

    const hasAgent = shiftData?.agentName;
    const activeShift = shiftData?.activeShiftName ?? shiftData?.shift;
    const styleKey = (activeShift ?? "PAGI").toUpperCase() as keyof typeof SHIFT_STYLES;
    const style = SHIFT_STYLES[styleKey] ?? SHIFT_STYLES.SIANG;

    // Determine banner background
    let bannerBg = "bg-gradient-to-r from-slate-600 to-slate-700";
    if (hasAgent) {
        bannerBg = style.bg;
    } else if (shiftData?.noScheduleUploaded) {
        bannerBg = "bg-gradient-to-r from-rose-700 to-rose-600";
    } else if (activeShift) {
        bannerBg = `${style.bg} opacity-70`;
    }

    // Build the status message
    const shiftNameId = activeShift ? (SHIFT_NAME_ID[activeShift] ?? activeShift) : null;

    return (
        <div className={`w-full text-white py-1.5 px-3 flex items-center justify-center z-40 fixed top-[73px] left-0 md:pl-72 shadow ${bannerBg} transition-all duration-700`}>
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Clock */}
                <div className="flex items-center gap-1 font-mono text-[11px] text-white/80 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">{format(currentTime, "EEEE, dd MMM yyyy • HH:mm:ss", { locale: id })}</span>
                    <span className="sm:hidden">{format(currentTime, "dd MMM • HH:mm:ss")}</span>
                </div>

                <div className="h-3 w-px bg-white/30 hidden sm:block" />

                {/* Status pill */}
                {hasAgent ? (
                    /* ✅ Agent on duty */
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-0.5 rounded-full font-semibold text-xs sm:text-sm tracking-wide">
                        <span>{style.icon}</span>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">On-Duty {shiftData!.shiftLabel}:</span>
                        <span className="sm:hidden">Bertugas:</span>
                        <span className="text-yellow-200 font-bold">{shiftData!.agentName}</span>
                    </div>
                ) : shiftData?.noScheduleUploaded ? (
                    /* ❌ No schedule uploaded at all */
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-0.5 rounded-full text-xs sm:text-sm">
                        <CalendarX className="w-3.5 h-3.5 text-rose-200" />
                        <span className="hidden sm:inline text-white/90">
                            Jadwal shift belum diunggah. Silakan unggah jadwal melalui menu <strong>Admin → Upload Jadwal PDF</strong>.
                        </span>
                        <span className="sm:hidden text-white/80">Jadwal belum diunggah</span>
                    </div>
                ) : activeShift ? (
                    /* ⚠️ Shift active but no agent scheduled today */
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-0.5 rounded-full text-xs sm:text-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-200" />
                        <span className="hidden sm:inline text-white/90">
                            {style.icon} Shift <strong>{shiftNameId}</strong> — Tidak ada petugas IT Support yang terjadwal saat ini.
                            Jika terdapat gangguan, silakan informasikan ke grup <strong>WhatsApp MIS IT Support</strong>.
                        </span>
                        <span className="sm:hidden text-white/80">Shift {shiftNameId} — Tidak ada petugas</span>
                    </div>
                ) : (
                    /* ℹ️ Outside shift hours */
                    <p className="text-[11px] text-white/70 italic">
                        <span className="hidden sm:inline">Di luar jam operasional shift IT Support</span>
                        <span className="sm:hidden">Di luar jam shift</span>
                    </p>
                )}
            </div>
        </div>
    );
}
