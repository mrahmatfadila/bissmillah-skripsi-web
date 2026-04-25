"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    MessageSquare, CheckCircle2, UserCheck, Ticket,
    RefreshCw, Loader2, Search, X, Filter, Clock,
    AlertTriangle, Activity, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

/* ─── Types ─────────────────────────────────── */
type ActivityType = "comment" | "ticket_created" | "status_changed" | "assigned";

interface ActivityEntry {
    id: string;
    type: ActivityType;
    ticketId: string;
    ticketNumber: string;
    ticketTitle: string;
    content: string;
    priority: string;
    status: string;
    actor: { id: string; name: string | null; image: string | null; role: string };
    createdAt: string;
}

/* ─── Config ─────────────────────────────────── */
const TYPE_CONFIG: Record<ActivityType, {
    label: string; color: string; bg: string; border: string;
    dot: string; icon: React.ReactNode;
}> = {
    comment: {
        label: "Komentar", color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500", icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    ticket_created: {
        label: "Tiket Dibuat", color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800",
        dot: "bg-purple-500", icon: <Ticket className="w-3.5 h-3.5" />,
    },
    status_changed: {
        label: "Status Berubah", color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500", icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    assigned: {
        label: "Ditugaskan", color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500", icon: <UserCheck className="w-3.5 h-3.5" />,
    },
};

const PRIORITY_COLOR: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-500 border-red-400",
    HIGH: "bg-orange-500/10 text-orange-500 border-orange-400",
    MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-400",
    LOW: "bg-gray-500/10 text-gray-500 border-gray-400",
};
const PRIORITY_LABEL: Record<string, string> = {
    CRITICAL: "Kritis", HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Rendah",
};
const STATUS_COLOR: Record<string, string> = {
    OPEN: "bg-blue-500/10 text-blue-600 border-blue-400",
    IN_PROGRESS: "bg-amber-500/10 text-amber-600 border-amber-400",
    PENDING: "bg-purple-500/10 text-purple-600 border-purple-400",
    RESOLVED: "bg-emerald-500/10 text-emerald-600 border-emerald-400",
    CLOSED: "bg-gray-500/10 text-gray-500 border-gray-400",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-400",
};
const STATUS_LABEL: Record<string, string> = {
    OPEN: "Terbuka", IN_PROGRESS: "Diproses", PENDING: "Tertunda",
    RESOLVED: "Selesai", CLOSED: "Ditutup", CANCELLED: "Dibatalkan",
};
const ROLE_LABEL: Record<string, string> = {
    SUPER_ADMIN: "Super Admin", ADMIN: "Admin", IT_SUPPORT: "IT Support",
    MANAGER: "Manager", SUPERVISOR: "Supervisor", USER: "User", DEVELOPER: "Developer",
};

/* ─── Helpers ────────────────────────────────── */
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "Baru saja";
    if (m < 60) return `${m} menit lalu`;
    if (h < 24) return `${h} jam lalu`;
    if (d < 7) return `${d} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDate(activities: ActivityEntry[]): Record<string, ActivityEntry[]> {
    const groups: Record<string, ActivityEntry[]> = {};
    activities.forEach(a => {
        const d = new Date(a.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label: string;
        if (d.toDateString() === today.toDateString()) label = "Hari Ini";
        else if (d.toDateString() === yesterday.toDateString()) label = "Kemarin";
        else label = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        if (!groups[label]) groups[label] = [];
        groups[label].push(a);
    });
    return groups;
}

/* ─── Main Page ──────────────────────────────── */
export default function ActivityPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(60);

    const fetchActivities = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch(`/api/activity?limit=${limit}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setActivities(data.activities || []);
            setTypeCounts(data.typeCounts || {});
            if (isRefresh) toast.success("Log aktivitas diperbarui");
        } catch {
            toast.error("Gagal memuat aktivitas");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, [limit]);

    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    const filtered = activities.filter(a => {
        const matchType = typeFilter === "ALL" || a.type === typeFilter;
        const q = search.toLowerCase();
        const matchSearch = !search ||
            a.ticketTitle.toLowerCase().includes(q) ||
            a.ticketNumber.toLowerCase().includes(q) ||
            (a.actor.name || "").toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    const grouped = groupByDate(filtered);
    const dateGroups = Object.entries(grouped);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/10 pb-16">

            {/* ── HEADER ── */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-6 h-6 text-blue-500" />
                                Log Aktivitas
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Riwayat lengkap semua aktivitas tiket sistem
                            </p>
                        </div>
                        <Button
                            size="sm" variant="outline"
                            onClick={() => fetchActivities(true)} disabled={refreshing}
                            className="gap-2 self-start sm:self-auto"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                            Perbarui
                        </Button>
                    </div>

                    {/* ── Filter Tabs ── */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {([
                            { key: "ALL", label: "Semua", count: activities.length },
                            { key: "comment", label: "Komentar", count: typeCounts.comment || 0 },
                            { key: "ticket_created", label: "Tiket Dibuat", count: typeCounts.ticket_created || 0 },
                            { key: "status_changed", label: "Status Berubah", count: typeCounts.status_changed || 0 },
                            { key: "assigned", label: "Penugasan", count: typeCounts.assigned || 0 },
                        ] as const).map(tab => {
                            const cfg = tab.key !== "ALL" ? TYPE_CONFIG[tab.key as ActivityType] : null;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setTypeFilter(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${typeFilter === tab.key
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/50"
                                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                                        }`}
                                >
                                    {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                                    {tab.label}
                                    <span className={`text-[10px] px-1 rounded ${typeFilter === tab.key ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Search ── */}
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari tiket, user, konten aktivitas..."
                            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-400 dark:focus:border-blue-600 text-gray-800 dark:text-gray-200"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-sm">Memuat log aktivitas...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                        <Filter className="w-12 h-12 opacity-20" />
                        <p className="font-medium">Tidak ada aktivitas ditemukan</p>
                        <p className="text-xs">{search ? `Tidak ada hasil untuk "${search}"` : "Coba ubah filter"}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {dateGroups.map(([dateLabel, entries]) => (
                            <div key={dateLabel}>
                                {/* Date Group Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5" />
                                        {dateLabel}
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                        {entries.length} aktivitas
                                    </span>
                                </div>

                                {/* Timeline */}
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

                                    <div className="space-y-1">
                                        {entries.map((activity) => {
                                            const cfg = TYPE_CONFIG[activity.type];
                                            const initials = (activity.actor.name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                                            return (
                                                <Link key={activity.id} href={`/tickets/${activity.ticketId}`}>
                                                    <div className="flex gap-3 group cursor-pointer">
                                                        {/* Timeline dot + avatar */}
                                                        <div className="relative shrink-0 flex flex-col items-center">
                                                            <div className={`w-9 h-9 rounded-full border-2 border-white dark:border-gray-950 shadow-sm ${cfg.dot} flex items-center justify-center z-10 group-hover:scale-110 transition-transform text-white`}>
                                                                {cfg.icon}
                                                            </div>
                                                        </div>

                                                        {/* Card */}
                                                        <Card className={`flex-1 mb-3 border ${cfg.border} ${cfg.bg} shadow-sm hover:shadow-md transition-all duration-200 group-hover:translate-x-0.5`}>
                                                            <CardContent className="p-3">
                                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {/* Actor */}
                                                                        <Avatar className="h-6 w-6 shrink-0">
                                                                            <AvatarImage src={activity.actor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.actor.name || '?')}&background=random&size=32`} />
                                                                            <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                                            {activity.actor.name || "Sistem"}
                                                                        </span>
                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 dark:border-gray-600 text-gray-500">
                                                                            {ROLE_LABEL[activity.actor.role] || activity.actor.role}
                                                                        </Badge>
                                                                        {/* Event type badge */}
                                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color} ${cfg.border}`}>
                                                                            {cfg.label}
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                                                                        {timeAgo(activity.createdAt)}
                                                                    </span>
                                                                </div>

                                                                {/* Ticket ref */}
                                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                    <span className="font-mono text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                                        {activity.ticketNumber}
                                                                    </span>
                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                                                        {activity.ticketTitle}
                                                                    </span>
                                                                </div>

                                                                {/* Content */}
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 bg-white/60 dark:bg-black/20 rounded-lg px-2.5 py-2 leading-relaxed border border-white/80 dark:border-gray-700/50">
                                                                    {activity.type === "comment" && <MessageSquare className="inline w-3 h-3 mr-1 opacity-60" />}
                                                                    {activity.content}
                                                                </p>

                                                                {/* Tags */}
                                                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLOR[activity.priority]}`}>
                                                                        {activity.priority === "CRITICAL" && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                                                                        {PRIORITY_LABEL[activity.priority] || activity.priority}
                                                                    </Badge>
                                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLOR[activity.status]}`}>
                                                                        {STATUS_LABEL[activity.status] || activity.status}
                                                                    </Badge>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Load more */}
                        {filtered.length >= limit && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setLimit(l => l + 40)}
                                    className="gap-2 text-sm"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    Muat Lebih Banyak
                                </Button>
                            </div>
                        )}

                        <p className="text-center text-xs text-gray-400 pt-2">
                            Menampilkan {filtered.length} dari {activities.length} aktivitas
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
