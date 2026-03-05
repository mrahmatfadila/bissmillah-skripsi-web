"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    RefreshCw, Loader2, Server, Activity, Users, MessageSquare,
    BookOpen, Bell, Ticket, Clock, Shield, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle2, Zap, Database,
} from "lucide-react";
import { toast } from "sonner";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
    ComposedChart, Line, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";

/* ─── Types ──────────────────────────────────────── */
interface MonitorData {
    generatedAt: string;
    counts: {
        tickets: number; users: number; comments: number; kb: number;
        notifications: number; unreadNotifs: number; permissions: number;
        resolvedTickets: number; openTickets: number;
    };
    statusCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    categoryCounts: { name: string; value: number }[];
    deptCounts: { name: string; value: number }[];
    sla: { compliant: number; violated: number; pending: number; rate: number };
    avgResolutionHours: number;
    topAssignees: { name: string; resolved: number; total: number }[];
    trend30: { date: string; created: number; resolved: number }[];
    dowActivity: { day: string; created: number; comments: number }[];
    hourlyDist: { hour: string; count: number }[];
    commentTrend: { date: string; count: number }[];
    roleDist: { role: string; count: number }[];
    systemInfo: { dbProvider: string; framework: string; orm: string; deployPlatform: string; nodeEnv: string };
}

/* ─── Colors ─────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3b82f6", IN_PROGRESS: "#f59e0b", PENDING: "#8b5cf6",
    RESOLVED: "#10b981", CLOSED: "#6b7280", CANCELLED: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
    OPEN: "Terbuka", IN_PROGRESS: "Diproses", PENDING: "Tertunda",
    RESOLVED: "Selesai", CLOSED: "Ditutup", CANCELLED: "Dibatalkan",
};
const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: "#dc2626", HIGH: "#f97316", MEDIUM: "#3b82f6", LOW: "#6b7280",
};
const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#3b82f6", "#ec4899", "#14b8a6"];

/* ─── KPI Card ───────────────────────────────────── */
function KpiCard({ label, value, sub, icon, gradient, trend }: {
    label: string; value: string | number; sub?: string;
    icon: React.ReactNode; gradient: string; trend?: "up" | "down" | "neutral";
}) {
    return (
        <Card className={`overflow-hidden border-0 shadow-lg bg-gradient-to-br ${gradient} text-white`}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="opacity-80 bg-white/10 p-2 rounded-xl">{icon}</div>
                    {trend && (
                        <div className={`text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/10 ${trend === "up" ? "text-green-200" : trend === "down" ? "text-red-200" : "text-white/60"}`}>
                            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                        </div>
                    )}
                </div>
                <div className="text-3xl font-black tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</div>
                <div className="text-xs font-semibold opacity-90 mt-1">{label}</div>
                {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
            </CardContent>
        </Card>
    );
}

/* ─── Live Indicator ─────────────────────────────── */
function LiveBadge({ countdown }: { countdown: number }) {
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span>Refresh dalam <strong>{countdown}s</strong></span>
        </div>
    );
}

/* ─── SLA Gauge ──────────────────────────────────── */
function SlaGauge({ rate }: { rate: number }) {
    const color = rate >= 90 ? "#10b981" : rate >= 70 ? "#f59e0b" : "#ef4444";
    return (
        <div className="flex flex-col items-center justify-center h-full py-4">
            <svg viewBox="0 0 120 70" className="w-44">
                <path d="M10 65 A50 50 0 0 1 110 65" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
                <path
                    d="M10 65 A50 50 0 0 1 110 65"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(rate / 100) * 157} 157`}
                />
                <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>{rate}%</text>
                <text x="60" y="72" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5">SLA Compliance</text>
            </svg>
            <div className="grid grid-cols-3 gap-2 w-full text-center text-xs mt-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                    <div className="font-bold text-emerald-600">✓ Tepat</div>
                    <div className="text-muted-foreground text-[11px]">Waktu</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                    <div className="font-bold text-red-600">✗ Batas</div>
                    <div className="text-muted-foreground text-[11px]">Dilanggar</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                    <div className="font-bold text-amber-600">⏳ Pending</div>
                    <div className="text-muted-foreground text-[11px]">Menunggu</div>
                </div>
            </div>
        </div>
    );
}

const REFRESH_INTERVAL = 30;

export default function MonitoringPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const router = useRouter();
    const [data, setData] = useState<MonitorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!permLoading && !hasPermission("dev_tools")) router.push("/tickets/mine");
    }, [permLoading, hasPermission, router]);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch("/api/dev/monitoring");
            if (!res.ok) throw new Error("Failed");
            setData(await res.json());
            setCountdown(REFRESH_INTERVAL);
            if (isRefresh) toast.success("Monitoring diperbarui ✓");
        } catch {
            toast.error("Gagal memuat data monitoring");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, []);

    // Auto-refresh countdown
    useEffect(() => {
        if (!autoRefresh) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { fetchData(true); return REFRESH_INTERVAL; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [autoRefresh, fetchData]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (permLoading || (!hasPermission("dev_tools") && !permLoading)) return null;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-4 text-white">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full" />
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm text-gray-400 font-mono">Menganalisis data sistem...</p>
            </div>
        </div>
    );

    if (!data) return null;
    const { counts: c, sla, trend30, statusCounts, priorityCounts, categoryCounts, deptCounts, topAssignees, dowActivity, hourlyDist, commentTrend, roleDist, systemInfo, avgResolutionHours } = data;

    const statusPie = Object.entries(statusCounts)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value, color: STATUS_COLORS[key] }));

    const priorityBar = Object.entries(priorityCounts)
        .map(([key, value]) => ({ name: key, value, fill: PRIORITY_COLORS[key] || "#94a3b8" }));

    const radarData = dowActivity.map(d => ({
        day: d.day, Tiket: d.created, Komentar: d.comments,
    }));

    const resolveRate = c.tickets > 0 ? Math.round((c.resolvedTickets / c.tickets) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#0f0f1a] pb-12">
            {/* ── HEADER ── */}
            <div className="bg-gradient-to-r from-[#1a0533] via-[#1e0a4f] to-[#0d1a3d] border-b border-purple-900/40 px-4 md:px-8 py-7">
                <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <Activity className="w-8 h-8 text-purple-400 animate-pulse" />
                            System Monitoring
                            <Badge className="bg-green-500/20 border-green-500 text-green-400 text-[10px]">LIVE</Badge>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 font-mono">
                            {systemInfo.framework} · {systemInfo.orm} · {systemInfo.dbProvider} · {systemInfo.deployPlatform}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {autoRefresh && <LiveBadge countdown={countdown} />}
                        <Button
                            size="sm" variant="outline"
                            onClick={() => setAutoRefresh(p => !p)}
                            className={`gap-2 text-xs border-gray-700 ${autoRefresh ? "text-green-400 border-green-600" : "text-gray-400"}`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            {autoRefresh ? "Auto ON" : "Auto OFF"}
                        </Button>
                        <Button
                            size="sm" variant="outline"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="gap-2 border-purple-700 text-purple-300 hover:bg-purple-900/30"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">

                {/* ── KPI GRID ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <KpiCard label="Total Tiket" value={c.tickets} icon={<Ticket className="w-5 h-5" />} gradient="from-blue-600 to-blue-800" trend="up" />
                    <KpiCard label="Tiket Aktif" value={c.openTickets} icon={<Activity className="w-5 h-5" />} gradient="from-amber-500 to-orange-700" sub={`${resolveRate}% diselesaikan`} />
                    <KpiCard label="Total User" value={c.users} icon={<Users className="w-5 h-5" />} gradient="from-purple-600 to-purple-900" trend="up" />
                    <KpiCard label="SLA Compliance" value={`${sla.rate}%`} icon={<Shield className="w-5 h-5" />} gradient={sla.rate >= 90 ? "from-emerald-500 to-emerald-800" : sla.rate >= 70 ? "from-amber-500 to-amber-800" : "from-red-500 to-red-800"} />
                    <KpiCard label="Avg. Resolusi" value={`${avgResolutionHours}j`} icon={<Clock className="w-5 h-5" />} gradient="from-cyan-600 to-cyan-900" sub="jam rata-rata" />
                    <KpiCard label="Knowledge Base" value={c.kb} icon={<BookOpen className="w-5 h-5" />} gradient="from-teal-500 to-teal-800" />
                    <KpiCard label="Komentar" value={c.comments} icon={<MessageSquare className="w-5 h-5" />} gradient="from-pink-500 to-pink-800" trend="up" />
                    <KpiCard label="Notif Belum Baca" value={c.unreadNotifs} icon={<Bell className="w-5 h-5" />} gradient="from-red-500 to-red-800" />
                    <KpiCard label="DB Records" value={c.tickets + c.users + c.comments + c.kb} icon={<Database className="w-5 h-5" />} gradient="from-indigo-600 to-indigo-900" />
                    <KpiCard label="Tiket Selesai" value={c.resolvedTickets} icon={<CheckCircle2 className="w-5 h-5" />} gradient="from-emerald-500 to-emerald-800" trend="up" />
                </div>

                {/* ── TREND 30 DAYS ── */}
                <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            Tren Tiket 30 Hari Terakhir
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-xs">Tiket dibuat vs diselesaikan per hari</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <ComposedChart data={trend30} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", color: "#fff", fontSize: 12 }} labelFormatter={v => `Tanggal: ${v}`} />
                                <Area type="monotone" dataKey="created" name="Dibuat" fill="url(#createdGrad)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="resolved" name="Diselesaikan" fill="url(#resolvedGrad)" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ── ROW: SLA + Status Pie + Priority ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SLA Gauge */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" /> SLA Compliance
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-xs">Critical=4j | High=8j | Medium=24j | Low=48j</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SlaGauge rate={sla.rate} />
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                <div className="bg-emerald-500/10 rounded p-1.5">
                                    <div className="font-bold text-emerald-400">{sla.compliant}</div>
                                    <div className="text-gray-500">Tepat Waktu</div>
                                </div>
                                <div className="bg-red-500/10 rounded p-1.5">
                                    <div className="font-bold text-red-400">{sla.violated}</div>
                                    <div className="text-gray-500">Dilanggar</div>
                                </div>
                                <div className="bg-amber-500/10 rounded p-1.5">
                                    <div className="font-bold text-amber-400">{sla.pending}</div>
                                    <div className="text-gray-500">Pending</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Pie */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-white text-sm">Distribusi Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={statusPie} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={3}>
                                        {statusPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Priority Bar */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-white text-sm">Distribusi Prioritas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={priorityBar} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={60} />
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Tiket">
                                        {priorityBar.map(e => <Cell key={e.name} fill={e.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ── ROW: Activity Radar + Hourly Dist ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radar by Day of Week */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-white text-sm">Aktivitas per Hari</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">Tiket dibuat & komentar berdasarkan hari dalam seminggu</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={230}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="#1f2937" />
                                    <PolarAngleAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                                    <PolarRadiusAxis tick={false} axisLine={false} />
                                    <Radar name="Tiket" dataKey="Tiket" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                    <Radar name="Komentar" dataKey="Komentar" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Hourly Distribution */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-white text-sm">Distribusi Jam (Heatmap)</CardTitle>
                            <CardDescription className="text-gray-500 text-xs">Jam berapa tiket paling banyak dibuat</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={hourlyDist} margin={{ left: -25, right: 5, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#6b7280" }} interval={2} />
                                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} />
                                    <Bar dataKey="count" name="Tiket" radius={[3, 3, 0, 0]}>
                                        {hourlyDist.map((entry, i) => {
                                            const max = Math.max(...hourlyDist.map(h => h.count));
                                            const intensity = max > 0 ? entry.count / max : 0;
                                            const r = Math.round(59 + intensity * (239 - 59));
                                            const g = Math.round(130 + intensity * (68 - 130));
                                            const b = Math.round(246 + intensity * (68 - 246));
                                            return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ── ROW: Top Assignees + Category + Comment Trend ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Assignees */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-amber-400" /> Top Teknisi
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-xs">Berdasarkan tiket yang diselesaikan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {topAssignees.length === 0 ? (
                                <p className="text-gray-600 text-xs text-center py-4">Belum ada data penugasan</p>
                            ) : topAssignees.map((a, i) => {
                                const rate = a.total > 0 ? Math.round((a.resolved / a.total) * 100) : 0;
                                return (
                                    <div key={a.name} className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-700 text-gray-300"}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-xs mb-0.5">
                                                <span className="text-gray-200 font-medium truncate">{a.name}</span>
                                                <span className="text-gray-400 shrink-0 ml-1">{a.resolved}/{a.total}</span>
                                            </div>
                                            <Progress value={rate} className="h-1.5" />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-400 w-10 text-right shrink-0">{rate}%</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm">Kategori Tiket Terbanyak</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={categoryCounts} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                                        {categoryCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }}
                                        formatter={(v, n) => [`${v} tiket`, n]} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Comment Trend 14d */}
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm">Aktivitas Komentar 14 Hari</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={commentTrend} margin={{ left: -20, right: 5, top: 5, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#6b7280" }} tickFormatter={v => v.slice(5)} />
                                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} labelFormatter={v => `Tgl: ${v}`} />
                                    <Area type="monotone" dataKey="count" stroke="#ec4899" fill="url(#cG)" strokeWidth={2} dot={{ r: 3, fill: "#ec4899" }} name="Komentar" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ── ROW: Dept Breakdown + Role Dist ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm">Tiket per Departemen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {deptCounts.map((d, i) => {
                                    const max = deptCounts[0]?.value || 1;
                                    return (
                                        <div key={d.name} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 w-32 truncate shrink-0">{d.name}</span>
                                            <div className="flex-1 bg-gray-800 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all duration-700"
                                                    style={{ width: `${(d.value / max) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-300 w-10 text-right shrink-0">{d.value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/60 border-gray-800 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-sm">Distribusi Role User</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={roleDist} margin={{ left: -20, right: 5, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="role" tick={{ fontSize: 8, fill: "#6b7280" }} tickFormatter={v => v.replace("_SHOP_DEWATA", "").replace("_SHOP_SAM", "").slice(0, 10)} />
                                    <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", fontSize: 11 }} />
                                    <Bar dataKey="count" name="User" radius={[4, 4, 0, 0]}>
                                        {roleDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ── DB Record Table ── */}
                <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader className="pb-2 border-b border-gray-800">
                        <CardTitle className="text-green-400 font-mono text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <Database className="w-4 h-4" /> DB Health — {systemInfo.dbProvider}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
                            {[
                                { table: "tickets (total)", count: c.tickets, ok: true },
                                { table: "tickets (open)", count: c.openTickets, ok: c.openTickets < 50 },
                                { table: "tickets (resolved)", count: c.resolvedTickets, ok: true },
                                { table: "users", count: c.users, ok: true },
                                { table: "comments", count: c.comments, ok: true },
                                { table: "knowledge_bases", count: c.kb, ok: true },
                                { table: "notifications", count: c.notifications, ok: true },
                                { table: "notif (unread)", count: c.unreadNotifs, ok: c.unreadNotifs < 100 },
                            ].map(r => (
                                <div key={r.table} className="flex items-center justify-between bg-gray-800/80 rounded-lg px-3 py-2 border border-gray-700/50">
                                    <span className="text-gray-400 truncate mr-2">{r.table}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`font-bold ${r.ok ? "text-green-400" : "text-amber-400"}`}>{r.count.toLocaleString()}</span>
                                        {r.ok ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-600 font-mono text-[10px] mt-3 text-right">
                            Generated: {new Date(data.generatedAt).toLocaleString("id-ID")}
                        </p>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
