"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle, CheckCircle2, RefreshCw, Tag, FileText, Type,
    UserX, MessageSquare, Building2, Clock, ShieldAlert, Loader2,
    ClipboardCheck, Activity, TrendingUp, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

/* ─── Types ────────────────────────────────────── */
interface IssueStat {
    label: string;
    count: number;
    percentage: number;
    color: string;
    icon: string;
}

interface LowQualityTicket {
    id: string;
    ticketNumber: string;
    title: string;
    score: number;
    issues: string[];
}

interface DuplicateTitle {
    title: string;
    count: number;
}

interface QualityData {
    summary: {
        total: number;
        qualityScore: number;
        cleanTickets: number;
        flaggedTickets: number;
        duplicateTitles: number;
    };
    issueBreakdown: IssueStat[];
    duplicateTitles: DuplicateTitle[];
    lowQualityTickets: LowQualityTicket[];
}

/* ─── Icon Map ─────────────────────────────────── */
const ICON_MAP: Record<string, React.ReactNode> = {
    tag: <Tag className="w-4 h-4" />,
    "file-text": <FileText className="w-4 h-4" />,
    type: <Type className="w-4 h-4" />,
    "user-x": <UserX className="w-4 h-4" />,
    "message-x": <MessageSquare className="w-4 h-4" />,
    building: <Building2 className="w-4 h-4" />,
    clock: <Clock className="w-4 h-4" />,
    "alert-triangle": <AlertTriangle className="w-4 h-4" />,
    "check-circle": <CheckCircle2 className="w-4 h-4" />,
};

/* ─── Score Badge ──────────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
    const max = 6;
    const pct = (score / max) * 100;
    if (pct >= 83) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">{score}/{max}</Badge>;
    if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">{score}/{max}</Badge>;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold">{score}/{max}</Badge>;
}

/* ─── Quality Gauge ────────────────────────────── */
function QualityGauge({ score }: { score: number }) {
    const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
    const data = [{ value: score, fill: color }];
    const label = score >= 80 ? "Baik" : score >= 60 ? "Cukup" : "Buruk";

    return (
        <div className="relative w-44 h-44 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" angleAxisId={0} background={{ fill: "hsl(var(--muted))" }} cornerRadius={8} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black" style={{ color }}>{score}%</span>
                <span className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</span>
            </div>
        </div>
    );
}

/* ─── Main Page ────────────────────────────────── */
export default function DataQualityPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [data, setData] = useState<QualityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await fetch("/api/data-quality");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
            if (isRefresh) toast.success("Data berhasil diperbarui");
        } catch {
            toast.error("Gagal memuat data kualitas");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Menganalisis kualitas data tiket...</p>
            </div>
        </div>
    );

    if (!data) return null;

    const { summary, issueBreakdown, duplicateTitles, lowQualityTickets } = data;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/10 pb-12">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            <Activity className="w-7 h-7 text-blue-500" />
                            Kualitas Data Tiket
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Analisis integritas & kelengkapan data dari {summary.total.toLocaleString()} tiket sistem
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="self-start sm:self-auto gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        Perbarui Analisis
                    </Button>
                </div>

                {/* ── Top Summary Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Tiket", value: summary.total, icon: <ClipboardCheck className="w-5 h-5" />, bg: "from-blue-500 to-blue-600" },
                        { label: "Tiket Bersih", value: summary.cleanTickets, icon: <CheckCircle2 className="w-5 h-5" />, bg: "from-emerald-500 to-emerald-600" },
                        { label: "Tiket Bermasalah", value: summary.flaggedTickets, icon: <AlertTriangle className="w-5 h-5" />, bg: "from-amber-500 to-orange-500" },
                        { label: "Judul Duplikat", value: summary.duplicateTitles, icon: <Copy className="w-5 h-5" />, bg: "from-purple-500 to-pink-500" },
                    ].map((item) => (
                        <Card key={item.label} className="overflow-hidden border-0 shadow-md">
                            <CardContent className="p-0">
                                <div className={`bg-gradient-to-br ${item.bg} p-4 text-white`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium opacity-90">{item.label}</span>
                                        <div className="opacity-80">{item.icon}</div>
                                    </div>
                                    <div className="text-3xl font-black">{item.value.toLocaleString()}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Quality Score + Issue Breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Score Gauge */}
                    <Card className="lg:col-span-1 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                Skor Kualitas Keseluruhan
                            </CardTitle>
                            <CardDescription>Berdasarkan 6 kriteria kelengkapan tiket</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center pb-6">
                            <QualityGauge score={summary.qualityScore} />
                            <div className="mt-4 w-full grid grid-cols-3 text-center text-xs gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                    <div className="font-bold text-emerald-600 dark:text-emerald-400">≥ 80%</div>
                                    <div className="text-muted-foreground">Baik</div>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                                    <div className="font-bold text-amber-600 dark:text-amber-400">60–79%</div>
                                    <div className="text-muted-foreground">Cukup</div>
                                </div>
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                                    <div className="font-bold text-red-600 dark:text-red-400">&lt; 60%</div>
                                    <div className="text-muted-foreground">Buruk</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Issue Breakdown */}
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                                Rincian Permasalahan Data
                            </CardTitle>
                            <CardDescription>Kategori masalah integritas yang terdeteksi sistem</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {issueBreakdown.filter(i => i.count > 0).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    <p className="font-medium text-emerald-600 dark:text-emerald-400">Tidak ada masalah terdeteksi 🎉</p>
                                </div>
                            ) : (
                                issueBreakdown.map((issue) => (
                                    <div key={issue.label} className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                                            style={{ backgroundColor: issue.color }}
                                        >
                                            {ICON_MAP[issue.icon]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium truncate">{issue.label}</span>
                                                <span className="text-sm font-bold ml-2 shrink-0" style={{ color: issue.color }}>
                                                    {issue.count} tiket
                                                </span>
                                            </div>
                                            <Progress
                                                value={issue.percentage}
                                                className="h-1.5"
                                                style={{ ['--progress-color' as string]: issue.color }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                                            {issue.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Duplicate Titles ── */}
                {duplicateTitles.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Copy className="w-4 h-4 text-purple-500" />
                                Judul Tiket Duplikat
                            </CardTitle>
                            <CardDescription>Tiket yang memiliki judul identik — kemungkinan pengajuan ganda</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {duplicateTitles.map((d) => (
                                    <div
                                        key={d.title}
                                        className="p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                            {d.count}x
                                        </div>
                                        <p className="text-sm text-foreground font-medium leading-snug line-clamp-2">{d.title}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Low Quality Tickets Table ── */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Daftar Tiket Bermasalah
                        </CardTitle>
                        <CardDescription>
                            {lowQualityTickets.length} tiket dengan skor kualitas terendah — perlu perhatian segera
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowQualityTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                <p className="font-medium text-emerald-600 dark:text-emerald-400">Semua tiket memenuhi standar kualitas 🎉</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-semibold w-28">No. Tiket</TableHead>
                                            <TableHead className="font-semibold">Judul</TableHead>
                                            <TableHead className="font-semibold text-center w-24">Skor</TableHead>
                                            <TableHead className="font-semibold">Masalah Terdeteksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowQualityTickets.map((ticket) => (
                                            <TableRow
                                                key={ticket.id}
                                                className="hover:bg-muted/30 cursor-pointer transition-colors"
                                                onClick={() => router.push(`/tickets/${ticket.id}`)}
                                            >
                                                <TableCell>
                                                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                        {ticket.ticketNumber}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium text-sm line-clamp-1">{ticket.title}</p>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <ScoreBadge score={ticket.score} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {ticket.issues.map((issue) => (
                                                            <span
                                                                key={issue}
                                                                className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                                                            >
                                                                {issue}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
