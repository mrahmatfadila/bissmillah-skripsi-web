"use client";

import { useEffect, useState, useRef } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Database, Cpu, FileText, RefreshCw, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
    ts: string;
    msg: string;
}
interface Stats {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    totalUsers: number;
    totalComments: number;
    totalNotifs: number;
}

const LEVEL_STYLE: Record<string, string> = {
    INFO: "text-green-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    SUCCESS: "text-emerald-300 font-semibold",
};

export default function DevLogsPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR" | "SUCCESS">("ALL");
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!permLoading && !hasPermission("dev_tools")) {
            router.push("/tickets/mine");
        }
    }, [permLoading, hasPermission, router]);

    const fetchLogs = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch("/api/dev/system-logs");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setLogs(data.logs || []);
            setStats(data.stats || null);
            if (isRefresh) toast.success("Log diperbarui");
        } catch {
            toast.error("Gagal memuat System Log");
        } finally {
            setLoading(false);
            setRefreshing(false);
            // Auto-scroll ke bawah
            setTimeout(() => {
                logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
            }, 100);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = filter === "ALL" ? logs : logs.filter(l => l.level === filter);

    const formatTs = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleString("id-ID", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    };

    if (permLoading || (!hasPermission("dev_tools") && !permLoading)) return null;

    return (
        <div className="min-h-screen bg-gray-950 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 px-4 md:px-8 py-8 border-b border-purple-900/50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-purple-300" />
                            System Logs
                        </h1>
                        <p className="text-purple-200 text-sm mt-1">Log aktivitas real-time dari database sistem</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs(true)}
                        disabled={refreshing}
                        className="border-purple-500 text-purple-200 hover:bg-purple-800 gap-2 self-start sm:self-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh Log
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: "Total Tiket", value: stats.totalTickets, icon: <Cpu className="w-4 h-4" />, color: "from-blue-600 to-blue-700" },
                            { label: "Tiket Terbuka", value: stats.openTickets, icon: <Activity className="w-4 h-4" />, color: "from-amber-600 to-amber-700" },
                            { label: "Tiket Selesai", value: stats.resolvedTickets, icon: <Code className="w-4 h-4" />, color: "from-emerald-600 to-emerald-700" },
                            { label: "Total User", value: stats.totalUsers, icon: <Database className="w-4 h-4" />, color: "from-purple-600 to-purple-700" },
                            { label: "Komentar", value: stats.totalComments, icon: <FileText className="w-4 h-4" />, color: "from-pink-600 to-pink-700" },
                            { label: "Notifikasi", value: stats.totalNotifs, icon: <Cpu className="w-4 h-4" />, color: "from-indigo-600 to-indigo-700" },
                        ].map(s => (
                            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-3 text-white`}>
                                <div className="flex items-center gap-1.5 mb-1 opacity-80">{s.icon}<span className="text-[11px] font-medium">{s.label}</span></div>
                                <div className="text-2xl font-black">{s.value.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Terminal Log */}
                <Card className="bg-gray-900 border-gray-700 shadow-xl">
                    <CardHeader className="pb-3 border-b border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                                    <span className="ml-2">system.log — IT Ticketing Support</span>
                                </CardTitle>
                                <CardDescription className="text-gray-500 text-xs mt-1">
                                    {filteredLogs.length} entri log {filter !== "ALL" ? `(filter: ${filter})` : ""}
                                </CardDescription>
                            </div>
                            {/* Filter buttons */}
                            <div className="flex flex-wrap gap-1.5">
                                {(["ALL", "INFO", "WARN", "ERROR", "SUCCESS"] as const).map(lv => (
                                    <button
                                        key={lv}
                                        onClick={() => setFilter(lv)}
                                        className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${filter === lv
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                            }`}
                                    >
                                        {lv}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span className="text-sm font-mono">Loading logs...</span>
                            </div>
                        ) : (
                            <div
                                ref={logRef}
                                className="bg-gray-950 font-mono text-xs p-4 h-[460px] overflow-y-auto space-y-1 rounded-b-lg"
                            >
                                {filteredLogs.length === 0 ? (
                                    <p className="text-gray-600 italic">Tidak ada log untuk filter ini.</p>
                                ) : (
                                    filteredLogs.map((log, i) => (
                                        <div key={i} className="flex gap-2 hover:bg-gray-900/50 px-1 py-0.5 rounded group">
                                            <span className="text-gray-600 shrink-0 w-36">{formatTs(log.ts)}</span>
                                            <Badge
                                                className={`shrink-0 h-4 text-[9px] px-1.5 rounded font-bold ${log.level === "WARN" ? "bg-yellow-900/70 text-yellow-300 border-yellow-700" :
                                                        log.level === "ERROR" ? "bg-red-900/70 text-red-300 border-red-700" :
                                                            log.level === "SUCCESS" ? "bg-emerald-900/70 text-emerald-300 border-emerald-700" :
                                                                "bg-blue-900/50 text-blue-300 border-blue-800"
                                                    }`}
                                                variant="outline"
                                            >
                                                {log.level}
                                            </Badge>
                                            <span className={`${LEVEL_STYLE[log.level] || "text-gray-300"} break-all`}>
                                                {log.msg}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
