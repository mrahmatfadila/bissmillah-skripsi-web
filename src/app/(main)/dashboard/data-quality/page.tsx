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
    ClipboardCheck, Activity, TrendingUp, Copy, Download,
} from "lucide-react";
import { toast } from "sonner";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

/* ─── Types ─────────────────────────────────────── */
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

/* ─── Icon Map ───────────────────────────────────── */
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

/* ─── Score Badge ────────────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
    const max = 6;
    const pct = (score / max) * 100;
    if (pct >= 83) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">{score}/{max}</Badge>;
    if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">{score}/{max}</Badge>;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold">{score}/{max}</Badge>;
}

/* ─── Quality Gauge ──────────────────────────────── */
function QualityGauge({ score }: { score: number }) {
    const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
    const data = [{ value: score, fill: color }];
    const label = score >= 80 ? "Baik" : score >= 60 ? "Cukup" : "Buruk";
    return (
        <div className="relative w-44 h-44 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
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

/* ─── PDF Export ─────────────────────────────────── */
async function exportToPDF(data: QualityData, userName: string) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const { summary, issueBreakdown, duplicateTitles, lowQualityTickets } = data;

    // ── Palette ───────────────────────────────────────
    const blue = [37, 99, 235] as [number, number, number];
    const white = [255, 255, 255] as [number, number, number];
    const gray100 = [248, 250, 252] as [number, number, number];
    const gray700 = [55, 65, 81] as [number, number, number];
    const gray400 = [156, 163, 175] as [number, number, number];
    const green = [16, 185, 129] as [number, number, number];
    const amber = [245, 158, 11] as [number, number, number];
    const red = [239, 68, 68] as [number, number, number];

    const scoreColor: [number, number, number] =
        summary.qualityScore >= 80 ? green :
            summary.qualityScore >= 60 ? amber : red;

    // ── HEADER BANNER ─────────────────────────────────
    doc.setFillColor(...blue);
    doc.rect(0, 0, pageW, 38, "F");

    doc.setTextColor(...white);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Kualitas Data Tiket", 14, 16);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("IT Ticketing Support System — Sistem Manajemen Tiket", 14, 23);
    doc.text(`Dibuat oleh  :  ${userName}`, 14, 29);
    doc.text(`Dicetak pada :  ${dateStr}`, 14, 34);

    // Quality Score badge top-right
    const qx = pageW - 40;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(qx - 4, 8, 34, 22, 3, 3, "F");
    doc.setTextColor(...white);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${summary.qualityScore}%`, qx + 8, 20, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Skor Kualitas", qx + 8, 26, { align: "center" });

    let y = 46;

    // ── SUMMARY CARDS ─────────────────────────────────
    doc.setTextColor(...gray700);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Analisis", 14, y);
    y += 5;

    const cards = [
        { label: "Total Tiket", value: summary.total, color: blue },
        { label: "Tiket Bersih", value: summary.cleanTickets, color: green },
        { label: "Tiket Bermasalah", value: summary.flaggedTickets, color: amber },
        { label: "Judul Duplikat", value: summary.duplicateTitles, color: [168, 85, 247] as [number, number, number] },
    ];

    const cardW = (pageW - 28 - 9) / 4;
    cards.forEach((c, i) => {
        const cx = 14 + i * (cardW + 3);
        doc.setFillColor(...c.color);
        doc.roundedRect(cx, y, cardW, 20, 2, 2, "F");
        doc.setTextColor(...white);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(c.value.toLocaleString(), cx + cardW / 2, y + 11, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(c.label, cx + cardW / 2, y + 17, { align: "center" });
    });

    y += 28;

    // ── INTERPRETASI SKOR ─────────────────────────────
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...gray400);
    const interp =
        summary.qualityScore >= 80
            ? `Kualitas data BAIK — ${summary.qualityScore}% kriteria terpenuhi. Pertahankan standar pengisian tiket.`
            : summary.qualityScore >= 60
                ? `Kualitas data CUKUP — ${summary.qualityScore}%. Perlu perbaikan pada tiket bermasalah di bawah.`
                : `Kualitas data BURUK — ${summary.qualityScore}%. Segera tindaklanjuti tiket bermasalah.`;
    doc.text(interp, 14, y);
    y += 8;

    // ── RINCIAN PERMASALAHAN ──────────────────────────
    doc.setTextColor(...gray700);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Rincian Permasalahan Data", 14, y);
    y += 4;

    const issueRows = issueBreakdown
        .filter(i => i.count > 0)
        .map(i => [
            i.label,
            i.count.toString(),
            `${i.percentage.toFixed(1)}%`,
            i.count === 0 ? "✓ Bersih" : "⚠ Ada Masalah",
        ]);

    if (issueRows.length === 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...gray400);
        doc.text("Tidak ada masalah terdeteksi — semua data bersih ✓", 14, y + 6);
        y += 14;
    } else {
        autoTable(doc, {
            startY: y,
            head: [["Kategori Masalah", "Jumlah Tiket", "Persentase", "Status"]],
            body: issueRows,
            theme: "striped",
            headStyles: { fillColor: blue, textColor: white, fontStyle: "bold", fontSize: 8 },
            bodyStyles: { fontSize: 8, textColor: gray700 },
            alternateRowStyles: { fillColor: gray100 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 28, halign: "center" },
                2: { cellWidth: 28, halign: "center" },
                3: { cellWidth: 44, halign: "center" },
            },
            margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── JUDUL DUPLIKAT ────────────────────────────────
    if (duplicateTitles.length > 0) {
        // Check if need new page
        if (y > 230) { doc.addPage(); y = 20; }

        doc.setTextColor(...gray700);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Judul Tiket Duplikat", 14, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            head: [["Judul Duplikat", "Jumlah Tiket"]],
            body: duplicateTitles.map(d => [d.title, `${d.count}x`]),
            theme: "striped",
            headStyles: { fillColor: [126, 34, 206] as [number, number, number], textColor: white, fontStyle: "bold", fontSize: 8 },
            bodyStyles: { fontSize: 8, textColor: gray700 },
            alternateRowStyles: { fillColor: gray100 },
            columnStyles: {
                0: { cellWidth: 155 },
                1: { cellWidth: 25, halign: "center" },
            },
            margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── DAFTAR TIKET BERMASALAH ───────────────────────
    if (lowQualityTickets.length > 0) {
        if (y > 200) { doc.addPage(); y = 20; }

        doc.setTextColor(...gray700);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Daftar Tiket Bermasalah", 14, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            head: [["No. Tiket", "Judul", "Skor", "Masalah Terdeteksi"]],
            body: lowQualityTickets.map(t => [
                t.ticketNumber,
                t.title.length > 48 ? t.title.slice(0, 48) + "…" : t.title,
                `${t.score}/6`,
                t.issues.join(", "),
            ]),
            theme: "striped",
            headStyles: { fillColor: [217, 119, 6] as [number, number, number], textColor: white, fontStyle: "bold", fontSize: 8 },
            bodyStyles: { fontSize: 7.5, textColor: gray700 },
            alternateRowStyles: { fillColor: gray100 },
            columnStyles: {
                0: { cellWidth: 28, halign: "center" },
                1: { cellWidth: 65 },
                2: { cellWidth: 16, halign: "center" },
                3: { cellWidth: 71 },
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                if (data.column.index === 2 && data.section === "body") {
                    const val = parseInt(data.cell.text[0]);
                    data.cell.styles.textColor =
                        val >= 5 ? green : val >= 3 ? amber : red;
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });
    }

    // ── FOOTER PER PAGE ───────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const footerY = doc.internal.pageSize.getHeight() - 8;
        doc.setDrawColor(...gray400);
        doc.setLineWidth(0.3);
        doc.line(14, footerY - 3, pageW - 14, footerY - 3);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray400);
        doc.text("IT Ticketing Support System — Laporan Kualitas Data", 14, footerY);
        doc.text(`Halaman ${p} dari ${totalPages}`, pageW - 14, footerY, { align: "right" });
    }

    const filename = `laporan-kualitas-data_${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return filename;
}

/* ─── Main Page ──────────────────────────────────── */
export default function DataQualityPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [data, setData] = useState<QualityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch("/api/data-quality");
            if (!res.ok) throw new Error("Failed");
            setData(await res.json());
            if (isRefresh) toast.success("Data berhasil diperbarui");
        } catch {
            toast.error("Gagal memuat data kualitas");
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    const handleExportPDF = async () => {
        if (!data) return;
        setExporting(true);
        try {
            const filename = await exportToPDF(data, session?.user?.name || "Admin");
            toast.success(`PDF berhasil diunduh: ${filename}`);
        } catch (e) {
            console.error(e);
            toast.error("Gagal membuat PDF, coba lagi");
        } finally {
            setExporting(false);
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
                            Analisis integritas &amp; kelengkapan data dari {summary.total.toLocaleString()} tiket sistem
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Perbarui
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {exporting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />
                            }
                            {exporting ? "Membuat PDF..." : "Unduh Laporan PDF"}
                        </Button>
                    </div>
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
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: issue.color }}>
                                            {ICON_MAP[issue.icon]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium truncate">{issue.label}</span>
                                                <span className="text-sm font-bold ml-2 shrink-0" style={{ color: issue.color }}>
                                                    {issue.count} tiket
                                                </span>
                                            </div>
                                            <Progress value={issue.percentage} className="h-1.5" />
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
                                    <div key={d.title} className="p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3">
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Daftar Tiket Bermasalah
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {lowQualityTickets.length} tiket dengan skor kualitas terendah — klik baris untuk buka detail
                                </CardDescription>
                            </div>
                        </div>
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
                                                            <span key={issue} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
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
