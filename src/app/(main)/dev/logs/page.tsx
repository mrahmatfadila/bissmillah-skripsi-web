"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw, Loader2, Activity, FileText, Download,
    Search, X, Zap, Copy, CheckCircle2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ──────── */
interface LogEntry {
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
    ts: string;
    msg: string;
}
interface Stats {
    totalTickets: number; openTickets: number; resolvedTickets: number;
    totalUsers: number; totalComments: number; totalNotifs: number;
}

const LEVEL_COLOR: Record<string, string> = {
    INFO: "text-cyan-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    SUCCESS: "text-emerald-300",
};
const LEVEL_BADGE: Record<string, string> = {
    INFO: "bg-cyan-900/60 text-cyan-300 border-cyan-700",
    WARN: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
    ERROR: "bg-red-900/60 text-red-300 border-red-700",
    SUCCESS: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
};

const REFRESH_INTERVAL = 15;

export default function DevLogsPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR" | "SUCCESS">("ALL");
    const [search, setSearch] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const [copied, setCopied] = useState(false);
    const [newLines, setNewLines] = useState<Set<number>>(new Set());
    const logRef = useRef<HTMLDivElement>(null);
    const prevCount = useRef(0);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!permLoading && !hasPermission("dev_tools")) router.push("/tickets/mine");
    }, [permLoading, hasPermission, router]);

    const fetchLogs = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch("/api/dev/system-logs");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            const incoming: LogEntry[] = data.logs || [];

            // Highlight new lines
            if (isRefresh && incoming.length > prevCount.current) {
                const newSet = new Set<number>();
                for (let i = 0; i < incoming.length - prevCount.current; i++) newSet.add(i);
                setNewLines(newSet);
                setTimeout(() => setNewLines(new Set()), 2000);
            }
            prevCount.current = incoming.length;
            setLogs(incoming);
            setStats(data.stats || null);
            setCountdown(REFRESH_INTERVAL);
            if (isRefresh) toast.success(`Log diperbarui — ${incoming.length} entri`, { duration: 2000 });
        } catch {
            toast.error("Gagal memuat System Log");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, []);

    // Auto-refresh countdown
    useEffect(() => {
        if (!autoRefresh) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { fetchLogs(true); return REFRESH_INTERVAL; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [autoRefresh, fetchLogs]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    // Auto-scroll
    useEffect(() => {
        if (autoScroll) logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(l => {
        const matchLevel = filter === "ALL" || l.level === filter;
        const matchSearch = !search || l.msg.toLowerCase().includes(search.toLowerCase()) || l.ts.includes(search);
        return matchLevel && matchSearch;
    });

    const formatTs = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleString("id-ID", {
            day: "2-digit", month: "2-digit", year: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    };

    const handleCopy = async () => {
        const text = filteredLogs.map(l => `[${l.ts}] [${l.level}] ${l.msg}`).join("\n");
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Log berhasil disalin!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const text = logs.map(l => `[${l.ts}] [${l.level}] ${l.msg}`).join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `system-logs_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Log berhasil diunduh!");
    };

    const levelCounts = logs.reduce((acc, l) => {
        acc[l.level] = (acc[l.level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (permLoading || (!hasPermission("dev_tools") && !permLoading)) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0f] pb-12">
            {/* ── HEADER ── */}
            <div className="bg-gradient-to-r from-[#0d0d1a] to-[#160d33] border-b border-purple-900/50 px-4 md:px-8 py-7">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-purple-400" />
                            System Logs
                            {autoRefresh && (
                                <span className="relative flex h-2 w-2 ml-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1 font-mono">Real-time log dari aktivitas DB sistem</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {autoRefresh && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded border border-gray-800">
                                ↻ {countdown}s
                            </span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setAutoRefresh(p => !p)}
                            className={`gap-1.5 text-xs border-gray-700 ${autoRefresh ? "text-green-400 border-green-700" : "text-gray-500"}`}>
                            <Zap className="w-3.5 h-3.5" />
                            {autoRefresh ? "Auto ON" : "Auto OFF"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAutoScroll(p => !p)}
                            className={`gap-1.5 text-xs border-gray-700 ${autoScroll ? "text-blue-400 border-blue-700" : "text-gray-500"}`}>
                            <ChevronDown className="w-3.5 h-3.5" />
                            {autoScroll ? "Scroll ON" : "Scroll OFF"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => fetchLogs(true)} disabled={refreshing}
                            className="gap-1.5 border-purple-700 text-purple-300 hover:bg-purple-900/30 text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopy}
                            className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800 text-xs">
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDownload}
                            className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800 text-xs">
                            <Download className="w-3.5 h-3.5" />
                            .txt
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
                {/* ── STATS ── */}
                {stats && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                            { label: "Total Tiket", value: stats.totalTickets },
                            { label: "Tiket Terbuka", value: stats.openTickets },
                            { label: "Selesai", value: stats.resolvedTickets },
                            { label: "Total User", value: stats.totalUsers },
                            { label: "Komentar", value: stats.totalComments },
                            { label: "Notifikasi", value: stats.totalNotifs },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-center">
                                <div className="text-xl font-black text-white">{s.value.toLocaleString()}</div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── LEVEL SUMMARY ── */}
                <div className="flex flex-wrap gap-2">
                    {(["ALL", "INFO", "WARN", "ERROR", "SUCCESS"] as const).map(lv => (
                        <button key={lv} onClick={() => setFilter(lv)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border ${filter === lv
                                    ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/50"
                                    : "bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600"
                                }`}>
                            {lv !== "ALL" && (
                                <span className={`w-2 h-2 rounded-full ${lv === "INFO" ? "bg-cyan-400" : lv === "WARN" ? "bg-yellow-400" : lv === "ERROR" ? "bg-red-400" : "bg-emerald-400"
                                    }`} />
                            )}
                            {lv}
                            {lv !== "ALL" && levelCounts[lv] !== undefined && (
                                <span className="bg-black/30 px-1 rounded text-[10px]">{levelCounts[lv]}</span>
                            )}
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari log..."
                                className="bg-gray-900 border border-gray-800 text-gray-200 text-xs rounded-lg pl-7 pr-7 py-1.5 focus:outline-none focus:border-purple-600 w-52 font-mono"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <X className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                                </button>
                            )}
                        </div>
                        <span className="text-gray-600 text-xs font-mono">{filteredLogs.length} / {logs.length}</span>
                    </div>
                </div>

                {/* ── TERMINAL ── */}
                <Card className="bg-[#0d0d0d] border-gray-800 shadow-2xl">
                    <CardHeader className="py-2.5 px-4 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-gray-500 font-mono text-xs ml-3">
                                system.log — IT Ticketing — {new Date().toLocaleString("id-ID")}
                            </span>
                            <span className="ml-auto">
                                {loading || refreshing ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                ) : (
                                    <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                                )}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-80 text-gray-600">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span className="font-mono text-sm">Loading logs...</span>
                            </div>
                        ) : (
                            <div ref={logRef} className="h-[520px] overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
                                {/* Boot header */}
                                <div className="text-gray-600 font-mono text-[11px] border-b border-gray-800 pb-2 mb-3">
                                    <span className="text-purple-400">IT-TICKETING SYSTEM</span> v1.0 · NeonDB PostgreSQL · Next.js 16
                                    <br />
                                    <span className="text-gray-700">{`$>`}</span> <span className="text-green-400">tail -f system.log</span>
                                </div>

                                {filteredLogs.length === 0 ? (
                                    <div className="text-gray-700 font-mono text-xs italic text-center py-12">
                                        {search ? `Tidak ada log yang cocok dengan "${search}"` : "Tidak ada log untuk filter ini."}
                                    </div>
                                ) : filteredLogs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2 font-mono text-[11px] rounded px-1 py-0.5 transition-all duration-700 group
                                            ${newLines.has(i) ? "bg-yellow-500/10 border border-yellow-500/30" : "hover:bg-gray-900/80"}`}
                                    >
                                        <span className="text-gray-700 shrink-0 w-32 hidden md:block">{formatTs(log.ts)}</span>
                                        <span className="text-gray-700 shrink-0 w-24 md:hidden">{log.ts.slice(11, 19)}</span>
                                        <Badge variant="outline" className={`shrink-0 h-[18px] text-[9px] px-1.5 py-0 rounded font-bold ${LEVEL_BADGE[log.level]}`}>
                                            {log.level}
                                        </Badge>
                                        <span className={`${LEVEL_COLOR[log.level] || "text-gray-300"} break-all leading-relaxed`}>
                                            {search ? highlightText(log.msg, search) : log.msg}
                                        </span>
                                        {newLines.has(i) && (
                                            <span className="shrink-0 text-[9px] text-yellow-400 font-bold ml-auto animate-pulse">NEW</span>
                                        )}
                                    </div>
                                ))}

                                {/* Cursor blink */}
                                <div className="font-mono text-xs text-gray-700 flex items-center gap-1 mt-2">
                                    <span>{`$>`}</span>
                                    <span className="w-2 h-4 bg-green-500 animate-pulse" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── FOOTER INFO ── */}
                <div className="text-[10px] text-gray-700 font-mono flex flex-wrap gap-x-4 gap-y-1">
                    <span>Total: <strong className="text-gray-500">{logs.length}</strong></span>
                    <span>INFO: <strong className="text-cyan-700">{levelCounts.INFO || 0}</strong></span>
                    <span>WARN: <strong className="text-yellow-700">{levelCounts.WARN || 0}</strong></span>
                    <span>ERROR: <strong className="text-red-700">{levelCounts.ERROR || 0}</strong></span>
                    <span>SUCCESS: <strong className="text-emerald-700">{levelCounts.SUCCESS || 0}</strong></span>
                    <span className="ml-auto">Auto-refresh: {autoRefresh ? `setiap ${REFRESH_INTERVAL}s` : "OFF"}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Highlight matching text ─────────────────────── */
function highlightText(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-yellow-400/30 text-yellow-300 rounded px-0.5">{part}</mark>
            : part
    );
}
