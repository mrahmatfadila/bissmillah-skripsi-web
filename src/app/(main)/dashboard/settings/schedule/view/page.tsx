"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ChevronLeft, ChevronRight, Calendar, Users, Sun, Moon,
    Sunrise, RefreshCw, LayoutGrid, List, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ScheduleEntry {
    id: string;
    date: string;
    shift: string;
    agentName: string;
}

const SHIFT_CONFIG = {
    PAGI: { label: "Pagi", hours: "06:00–15:00", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: Sunrise, gradient: "from-amber-400 to-orange-500", emoji: "🌅" },
    SIANG: { label: "Siang", hours: "13:30–22:30", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Sun, gradient: "from-blue-500 to-indigo-600", emoji: "☀️" },
    MALAM: { label: "Malam", hours: "21:30–06:30", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: Moon, gradient: "from-purple-700 to-slate-800", emoji: "🌙" },
};

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAY_NAMES_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_NAMES_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const shortenName = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    const filtered = parts.filter((p, i) => !(i === 0 && /^[A-Za-z]\.$/.test(p)));
    return filtered[0] || name;
};

export default function ScheduleViewPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"calendar" | "list">("calendar");

    const fetchSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/schedule/monthly?year=${year}&month=${month}`);
            if (res.ok) setScheduleData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

    const prevMonth = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
    const nextMonth = () => month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1);

    // Group entries by day
    const byDay: Record<number, ScheduleEntry[]> = {};
    scheduleData.forEach(e => {
        const d = new Date(e.date).getUTCDate();
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(e);
    });

    // Calendar grid helpers
    const firstDow = getDay(startOfMonth(new Date(year, month - 1, 1)));
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
    const cells: (number | null)[] = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    // Stats
    const uniqueAgents = [...new Set(scheduleData.map(s => s.agentName))];
    const shiftCounts = { PAGI: 0, SIANG: 0, MALAM: 0 };
    scheduleData.forEach(s => { if (s.shift in shiftCounts) shiftCounts[s.shift as keyof typeof shiftCounts]++; });
    const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;

    return (
        <div className="px-3 sm:px-6 py-6 max-w-7xl mx-auto space-y-5 min-h-screen pb-24">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
                        Jadwal Kerja IT Support
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Dept. MIS — {MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                        variant="outline" size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => setView(v => v === "calendar" ? "list" : "calendar")}
                    >
                        {view === "calendar"
                            ? <><List className="w-3.5 h-3.5" /> List</>
                            : <><LayoutGrid className="w-3.5 h-3.5" /> Kalender</>}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={fetchSchedule}>
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/20 col-span-2 lg:col-span-1">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Total Petugas</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{uniqueAgents.length}</p>
                            <p className="text-[10px] text-blue-500/70 dark:text-blue-400/60 truncate max-w-[140px]">
                                {uniqueAgents.map(shortenName).join(", ")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {(["PAGI", "SIANG", "MALAM"] as const).map(shift => {
                    const cfg = SHIFT_CONFIG[shift];
                    const Icon = cfg.icon;
                    return (
                        <Card key={shift} className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg.gradient} text-white shrink-0`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{cfg.emoji} {cfg.label}</p>
                                    <p className="text-2xl font-bold text-foreground">{shiftCounts[shift]}</p>
                                    <p className="text-[10px] text-muted-foreground hidden sm:block">{cfg.hours}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Month Navigator ── */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-3 shadow-sm">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="w-9 h-9">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">{MONTH_NAMES[month - 1]} {year}</h2>
                    <p className="text-[11px] text-muted-foreground">{scheduleData.length} entri · {uniqueAgents.length} petugas</p>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="w-9 h-9">
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* ── Main Content ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                    <p className="text-sm">Memuat jadwal...</p>
                </div>
            ) : scheduleData.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl space-y-2">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
                    <p className="font-semibold text-foreground">Belum ada data jadwal</p>
                    <p className="text-sm text-muted-foreground">Upload PDF jadwal di menu <strong>Upload Jadwal PDF</strong></p>
                </div>

            ) : view === "calendar" ? (
                /* ══ CALENDAR VIEW ══ */
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {/* Header row */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                        {DAY_NAMES_SHORT.map((d, i) => (
                            <div key={d} className={`text-center py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider
                                ${i === 0 || i === 6 ? "text-red-500 dark:text-red-400" : "text-muted-foreground"}`}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="grid grid-cols-7 divide-x divide-y divide-border">
                        {cells.map((day, idx) => {
                            const dow = idx % 7;
                            const isWeekend = dow === 0 || dow === 6;
                            const isToday = day === todayDay;
                            const entries = day ? (byDay[day] || []) : [];

                            return (
                                <div key={idx} className={`
                                    min-h-[80px] sm:min-h-[110px] p-1 sm:p-2 transition-colors relative
                                    ${!day ? "bg-muted/20" : ""}
                                    ${isWeekend && day ? "bg-red-50/30 dark:bg-red-950/10" : ""}
                                    ${isToday ? "bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 ring-inset" : ""}
                                `}>
                                    {day && (
                                        <>
                                            <div className={`
                                                w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                                                text-[11px] sm:text-sm font-bold mb-1
                                                ${isToday
                                                    ? "bg-blue-500 text-white"
                                                    : isWeekend
                                                        ? "text-red-500 dark:text-red-400"
                                                        : "text-foreground"
                                                }`}>
                                                {day}
                                            </div>
                                            <div className="space-y-0.5">
                                                {entries.map(entry => {
                                                    const cfg = SHIFT_CONFIG[entry.shift as keyof typeof SHIFT_CONFIG];
                                                    if (!cfg) return null;
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={entry.id} title={`${cfg.emoji} ${entry.agentName} — ${cfg.label} (${cfg.hours})`}
                                                            className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border truncate ${cfg.color}`}>
                                                            <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
                                                            <span className="truncate">{shortenName(entry.agentName)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            ) : (
                /* ══ LIST VIEW ══ */
                <div className="space-y-3">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const entries = byDay[day] || [];
                        if (entries.length === 0) return null;
                        const dateObj = new Date(year, month - 1, day);
                        const dayFull = format(dateObj, "EEEE", { locale: idLocale });
                        const isToday = day === todayDay;
                        const dow = dateObj.getDay();
                        const isWknd = dow === 0 || dow === 6;

                        return (
                            <Card key={day} className={`border-border shadow-sm overflow-hidden transition-all
                                ${isToday ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}
                                ${isWknd ? "border-red-200/60 dark:border-red-900/50" : ""}
                            `}>
                                <CardHeader className="py-3 px-4 flex flex-row items-center gap-3 space-y-0 bg-muted/20">
                                    {/* Day Badge */}
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-sm shrink-0
                                        bg-gradient-to-br ${isToday ? "from-blue-500 to-blue-700" : isWknd ? "from-red-400 to-rose-600" : "from-slate-500 to-slate-700"}`}>
                                        <span className="text-base sm:text-lg leading-none">{day}</span>
                                        <span className="text-[8px] sm:text-[9px] opacity-80 uppercase">{dayFull.slice(0, 3)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm sm:text-base truncate">
                                            {dayFull}, {day} {MONTH_NAMES[month - 1]} {year}
                                        </CardTitle>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            {entries.length} shift terjadwal
                                        </p>
                                    </div>
                                    {isToday && (
                                        <Badge className="ml-auto shrink-0 bg-blue-500 text-white text-[10px]">Hari Ini</Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-3 pb-3 px-4">
                                    <div className="flex flex-wrap gap-2">
                                        {entries.map(entry => {
                                            const cfg = SHIFT_CONFIG[entry.shift as keyof typeof SHIFT_CONFIG];
                                            if (!cfg) return null;
                                            const Icon = cfg.icon;
                                            return (
                                                <div key={entry.id}
                                                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium ${cfg.color}`}>
                                                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                                    <span>{shortenName(entry.agentName)}</span>
                                                    <span className="text-[10px] opacity-60 hidden sm:inline">({cfg.label} · {cfg.hours})</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex flex-wrap gap-2 pt-1">
                {(["PAGI", "SIANG", "MALAM"] as const).map(shift => {
                    const cfg = SHIFT_CONFIG[shift];
                    const Icon = cfg.icon;
                    return (
                        <div key={shift} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            <span className="font-semibold">{cfg.emoji} {cfg.label}</span>
                            <span className="opacity-60 hidden sm:inline">{cfg.hours}</span>
                        </div>
                    );
                })}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />Hari Ini
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs text-red-500 dark:text-red-400">
                    <div className="w-3 h-3 rounded-full bg-red-400 shrink-0" />Weekend
                </div>
            </div>
        </div>
    );
}
