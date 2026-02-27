"use client";

import { useEffect, useState } from "react";
import { Clock, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ShiftData {
    shift: string;
    shiftLabel: string;
    agentName: string;
    date: string;
}

const SHIFT_STYLES: Record<string, { bg: string; icon: string }> = {
    PAGI: { bg: "bg-gradient-to-r from-amber-500 to-orange-400", icon: "🌅" },
    SIANG: { bg: "bg-gradient-to-r from-blue-600 to-indigo-500", icon: "☀️" },
    MALAM: { bg: "bg-gradient-to-r from-purple-800 to-slate-900", icon: "🌙" },
};

export function LiveShiftBanner() {
    const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchShift = async () => {
        try {
            const res = await fetch("/api/schedule/live", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setCurrentShift(data?.agentName ? data : null);
            }
        } catch { setCurrentShift(null); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchShift();
        const shiftTimer = setInterval(fetchShift, 60_000);
        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => { clearInterval(shiftTimer); clearInterval(clockTimer); };
    }, []);

    if (loading) return null;

    const styleKey = currentShift?.shift?.toUpperCase() as keyof typeof SHIFT_STYLES;
    const style = SHIFT_STYLES[styleKey] ?? SHIFT_STYLES.SIANG;
    const bannerBg = currentShift ? style.bg : "bg-gradient-to-r from-slate-600 to-slate-700";

    return (
        <div className={`w-full text-white py-1.5 px-3 flex items-center justify-center z-40 fixed top-[73px] left-0 md:pl-72 shadow ${bannerBg} transition-all duration-700`}>
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {/* Clock */}
                <div className="flex items-center gap-1 font-mono text-[11px] text-white/80 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">{format(currentTime, "EEEE, dd MMM yyyy • HH:mm:ss", { locale: id })}</span>
                    <span className="sm:hidden">{format(currentTime, "dd MMM • HH:mm:ss")}</span>
                </div>

                {currentShift && <div className="h-3 w-px bg-white/30 hidden sm:block" />}

                {/* On-Duty pill */}
                {currentShift ? (
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-0.5 rounded-full font-semibold text-xs sm:text-sm tracking-wide">
                        <span>{style.icon}</span>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">On-Duty {currentShift.shiftLabel}:</span>
                        <span className="sm:hidden">Bertugas:</span>
                        <span className="text-yellow-200 font-bold">{currentShift.agentName}</span>
                    </div>
                ) : (
                    <p className="text-[11px] text-white/70 italic">
                        <span className="hidden sm:inline">Belum ada jadwal shift · Upload PDF di menu Admin</span>
                        <span className="sm:hidden">Belum ada jadwal</span>
                    </p>
                )}
            </div>
        </div>
    );
}
