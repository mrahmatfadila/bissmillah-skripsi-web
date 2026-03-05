"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3, Database, RefreshCw, Loader2, Server,
    Ticket, Users, MessageSquare, BookOpen, Bell, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface MonitoringData {
    dbStats: {
        totalTickets: number; openTickets: number; inProgressTickets: number;
        pendingTickets: number; resolvedTickets: number; closedTickets: number;
        cancelledTickets: number; totalUsers: number; activeUsers: number;
        totalComments: number; totalKb: number; totalNotifs: number;
        priorityCritical: number; priorityHigh: number; priorityMedium: number; priorityLow: number;
    };
    trendData: { date: string; count: number }[];
    systemInfo: {
        dbProvider: string; framework: string; orm: string;
        deployPlatform: string; nodeEnv: string; generatedAt: string;
    };
}

const STATUS_COLORS: Record<string, string> = {
    "Terbuka": "#3b82f6",
    "Diproses": "#f59e0b",
    "Tertunda": "#8b5cf6",
    "Selesai": "#10b981",
    "Ditutup": "#6b7280",
    "Dibatalkan": "#ef4444",
};
const PRIORITY_COLORS = ["#dc2626", "#f97316", "#3b82f6", "#6b7280"];

export default function MonitoringPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const router = useRouter();
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!permLoading && !hasPermission("dev_tools")) {
            router.push("/tickets/mine");
        }
    }, [permLoading, hasPermission, router]);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch("/api/dev/monitoring");
            if (!res.ok) throw new Error("Failed");
            setData(await res.json());
            if (isRefresh) toast.success("Data monitoring diperbarui");
        } catch {
            toast.error("Gagal memuat data monitoring");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (permLoading || (!hasPermission("dev_tools") && !permLoading)) return null;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-sm">Memuat data monitoring...</p>
            </div>
        </div>
    );

    if (!data) return null;
    const { dbStats: s, trendData, systemInfo } = data;

    const statusPie = [
        { name: "Terbuka", value: s.openTickets },
        { name: "Diproses", value: s.inProgressTickets },
        { name: "Tertunda", value: s.pendingTickets },
        { name: "Selesai", value: s.resolvedTickets },
        { name: "Ditutup", value: s.closedTickets },
        { name: "Dibatalkan", value: s.cancelledTickets },
    ].filter(d => d.value > 0);

    const priorityBar = [
        { name: "Critical", value: s.priorityCritical, fill: "#dc2626" },
        { name: "High", value: s.priorityHigh, fill: "#f97316" },
        { name: "Medium", value: s.priorityMedium, fill: "#3b82f6" },
        { name: "Low", value: s.priorityLow, fill: "#6b7280" },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/10 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-800 to-purple-900 px-4 md:px-8 py-8 border-b border-purple-900/50">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-purple-300" />
                            System Monitoring
                        </h1>
                        <p className="text-purple-200 text-sm mt-1">
                            Statistik real-time dari database — {systemInfo.dbProvider}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-300 border-green-600 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {systemInfo.nodeEnv}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="border-purple-500 text-purple-200 hover:bg-purple-800 gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* System Info Strip */}
                <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="py-3 px-4">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
                            {[
                                { k: "Framework", v: systemInfo.framework },
                                { k: "ORM", v: systemInfo.orm },
                                { k: "Database", v: systemInfo.dbProvider },
                                { k: "Platform", v: systemInfo.deployPlatform },
                                { k: "Generated", v: new Date(systemInfo.generatedAt).toLocaleString("id-ID") },
                            ].map(item => (
                                <span key={item.k} className="text-gray-400">
                                    <span className="text-purple-400">{item.k}:</span>{" "}
                                    <span className="text-green-400">{item.v}</span>
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* DB Record Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: "Total Tiket", value: s.totalTickets, icon: <Ticket className="w-5 h-5" />, color: "from-blue-500 to-blue-600" },
                        { label: "Total User", value: s.totalUsers, icon: <Users className="w-5 h-5" />, color: "from-purple-500 to-purple-600" },
                        { label: "Komentar", value: s.totalComments, icon: <MessageSquare className="w-5 h-5" />, color: "from-cyan-500 to-cyan-600" },
                        { label: "Knowledge Base", value: s.totalKb, icon: <BookOpen className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600" },
                        { label: "Notifikasi", value: s.totalNotifs, icon: <Bell className="w-5 h-5" />, color: "from-amber-500 to-amber-600" },
                        { label: "Staf Aktif", value: s.activeUsers, icon: <Server className="w-5 h-5" />, color: "from-pink-500 to-pink-600" },
                    ].map(item => (
                        <Card key={item.label} className="overflow-hidden border-0 shadow-md">
                            <CardContent className="p-0">
                                <div className={`bg-gradient-to-br ${item.color} p-4 text-white`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] opacity-90">{item.label}</span>
                                        <div className="opacity-70">{item.icon}</div>
                                    </div>
                                    <div className="text-3xl font-black">{item.value.toLocaleString()}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Pie */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Distribusi Status Tiket</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props) => `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                        {statusPie.map((entry) => (
                                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Priority Bar */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Distribusi Prioritas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={priorityBar} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {priorityBar.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 7-day Trend */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Tren Tiket 7 Hari</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip labelFormatter={v => `Tanggal: ${v}`} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tiket Baru" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* DB Status */}
                <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-400 font-mono flex items-center gap-2">
                            <Database className="w-4 h-4" /> Database Records Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
                            {[
                                { table: "tickets", count: s.totalTickets },
                                { table: "users", count: s.totalUsers },
                                { table: "comments", count: s.totalComments },
                                { table: "knowledge_bases", count: s.totalKb },
                                { table: "notifications", count: s.totalNotifs },
                                { table: "open_tickets", count: s.openTickets },
                                { table: "resolved_tickets", count: s.resolvedTickets },
                                { table: "critical_priority", count: s.priorityCritical },
                            ].map(r => (
                                <div key={r.table} className="flex justify-between bg-gray-800 rounded px-3 py-2">
                                    <span className="text-gray-400">{r.table}</span>
                                    <span className="text-green-400 font-bold">{r.count.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
