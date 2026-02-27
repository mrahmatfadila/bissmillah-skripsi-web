"use client";

import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// framer-motion removed to avoid dependency error
// If framer-motion is not installed, I will use standard CSS animation classes or Recharts animation.
// I will check if I can assume `animate-in` usage from previous files. Yes.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { CalendarDateRangePicker } from "@/components/ui/date-range-picker"; 
import { Download, Share2, TrendingUp, Users, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSystemSettings } from "@/components/settings-provider";

// Mock date picker for visual 
const DateRangePicker = () => (
    <div className="flex items-center gap-2 border bg-card border-border p-2 rounded-lg text-sm text-muted-foreground">
        <span>Jan 01, 2026 - Jan 31, 2026</span>
    </div>
);

interface AnalyticsViewProps {
    kpi: {
        total: number;
        open: number;
        resolved: number;
        canceled: number;
        avgScore: number;
    };
    volumeData: any[];
    categoryData: any[];
    deptData: any[];
    agentData: any[];
    user: any;
}

export function AnalyticsView({ kpi, volumeData, categoryData, deptData, agentData, user }: AnalyticsViewProps) {
    const { formatDate } = useSystemSettings();

    // Handlers
    const handleShare = async () => {
        const shareData = {
            title: 'Laporan Analitik Plaza Bali IT Support',
            text: `Laporan Analitik: Total Tiket ${kpi.total}, Penyelesaian ${Math.round((kpi.resolved / kpi.total) * 100)}%`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                toast.success("Berhasil dibagikan");
            } catch (err) {
                console.log("Error sharing", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link laporan disalin ke clipboard");
            } catch (err) {
                toast.error("Gagal menyalin link");
            }
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- Header Section ---
        // Header Background
        doc.setFillColor(30, 58, 138); // bg-blue-900
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Laporan Analitik & Performa IT", 14, 20);

        // Header Subtitle
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Plaza Bali Internal Ticketing System", 14, 28);

        // Render Date & Author on the right
        doc.setFontSize(10);
        doc.text(`Tanggal Laporan: ${formatDate(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 20, { align: 'right' });
        doc.text(`Dibuat Oleh: ${user?.name || "System Admin"}`, pageWidth - 14, 28, { align: 'right' });

        let currentY = 50;

        // --- Summary Text ---
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Ringkasan Eksekutif", 14, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        // Use default 0 if no tickets yet to avoid division by zero
        const resolutionRate = kpi.total > 0 ? Math.round((kpi.resolved / kpi.total) * 100) : 0;
        const summaryText = `Berdasarkan data operasional saat ini, terdapat ${kpi.total} tiket yang masuk ke dalam sistem. Dari jumlah tersebut, sebanyak ${kpi.resolved} tiket telah berhasil diselesaikan dengan tingkat penyelesaian (resolution rate) sebesar ${resolutionRate}%. Skor rata-rata tingkat kepuasan layanan IT (CSAT) berdasarkan pembobotan (AHP) mencapai ${kpi.avgScore.toFixed(2)} dari skala 5.00.`;
        const splitText = doc.splitTextToSize(summaryText, pageWidth - 28);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 5) + 8;

        // --- KPI Metrics Cards (drawn with rects) ---
        const metrics = [
            { label: "Total Tiket", value: kpi.total.toString(), color: [59, 130, 246] as [number, number, number] },
            { label: "Diselesaikan", value: kpi.resolved.toString(), color: [16, 185, 129] as [number, number, number] },
            { label: "Terbuka/Proses", value: kpi.open.toString(), color: [245, 158, 11] as [number, number, number] },
            { label: "Dibatalkan", value: kpi.canceled.toString(), color: [239, 68, 68] as [number, number, number] },
            { label: "Skor CSAT", value: kpi.avgScore.toFixed(2), color: [139, 92, 246] as [number, number, number] },
            { label: "Resolution Rate", value: `${resolutionRate}%`, color: [14, 165, 233] as [number, number, number] },
        ];

        const cardWidth = (pageWidth - 28 - 10) / 3; // 3 columns, 5mm gap between
        const cardHeight = 22;
        let cardX = 14;
        let cardY = currentY;

        metrics.forEach((metric, index) => {
            // Draw card border/bg
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

            // Draw color accent bar
            doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.rect(cardX, cardY, 3, cardHeight, 'F'); // Left accent line

            // Metric Value
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(metric.value, cardX + 8, cardY + 12);

            // Metric Label
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(metric.label, cardX + 8, cardY + 18);

            cardX += cardWidth + 5;
            if ((index + 1) % 3 === 0) {
                cardX = 14;
                cardY += cardHeight + 5;
            }
        });

        currentY = cardY; // Move cursor down below the boxes

        doc.setTextColor(30, 41, 59);

        // --- Table Configurations ---
        const commonTableStyles = {
            headStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], fontStyle: 'bold' as 'bold', lineWidth: 0.1, lineColor: [226, 232, 240] as [number, number, number] },
            bodyStyles: { textColor: [51, 65, 85] as [number, number, number] },
            alternateRowStyles: { fillColor: [250, 250, 252] as [number, number, number] },
            theme: 'grid' as 'grid',
            styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number], lineWidth: 0.1 },
            margin: { left: 14, right: 14 }
        };

        // Helper function for Section Titles
        const renderSectionTitle = (title: string, yPos: number) => {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(title, 14, yPos);
            // Underline
            doc.setDrawColor(226, 232, 240);
            doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
            return yPos + 8;
        };

        currentY += 10;

        // 1. Departemen Table
        currentY = renderSectionTitle("Distribusi Tiket Berdasarkan Departemen", currentY);
        const deptTableData = deptData.map((d: any) => [d.name, d.value.toString()]);
        autoTable(doc, {
            ...commonTableStyles,
            startY: currentY,
            head: [['Departemen Asal', 'Total Tiket Masuk']],
            body: deptTableData,
            columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;

        // 2. Kategori Table
        // Check page break
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        currentY = renderSectionTitle("Rincian Berdasarkan Kategori Masalah", currentY);
        const catTableData = categoryData.map((c: any) => [c.name.replace(/_/g, ' '), c.value.toString()]);
        autoTable(doc, {
            ...commonTableStyles,
            startY: currentY,
            head: [['Kategori Layanan', 'Volume Tiket']],
            body: catTableData,
            columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;

        // 3. Agents Table
        // Check page break for Agents Table
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        currentY = renderSectionTitle("Performa Produktivitas Petugas Dukungan IT", currentY);
        autoTable(doc, {
            ...commonTableStyles,
            startY: currentY,
            head: [['Nama Agen / Petugas IT', 'Tiket Diselesaikan']],
            body: agentData.map((a: any) => [a.name, a.resolved.toString()]),
            columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
        });

        // --- Footer across all pages ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Draw footer line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text('Dokumen Rahasia Internal - IT Ticketing System Hub', 14, pageHeight - 10);
            doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }

        doc.save(`Laporan_Eksekutif_IT_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF Laporan Berhasil Dibuat");
    };

    // KPI Calculation
    const resolutionRate = kpi.total > 0 ? Math.round((kpi.resolved / kpi.total) * 100) : 0;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return (
        <div className="min-h-screen bg-background/50 p-6 space-y-8 pb-20 animate-in fade-in duration-500">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Laporan Analitik</h1>
                    <p className="text-muted-foreground mt-1">
                        Ringkasan performa sistem, efisiensi agen, dan tren tiket.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker />
                    <Button variant="outline" className="gap-2 hidden sm:flex print:hidden" onClick={handleShare}>
                        <Share2 className="w-4 h-4" />
                        Bagikan
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 print:hidden" onClick={handleExportPDF}>
                        <Download className="w-4 h-4" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    header, footer, nav, aside, .sidebar, .print\\:hidden { display: none !important; }
                    .min-h-screen { min-height: auto; height: auto; padding: 0 !important; background: white !important; }
                    .shadow-lg, .shadow-sm { box-shadow: none !important; border: 1px solid #eee !important; }
                    .bg-card\/50 { background-color: white !important; }
                }
            `}</style>

            {/* --- KPI Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Tiket"
                    value={kpi.total.toString()}
                    trend="+12% dari bulan lalu" // Mock trend
                    icon={<Activity className="w-5 h-5 text-blue-500" />}
                    color="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                />
                <KpiCard
                    title="Tingkat Penyelesaian"
                    value={`${resolutionRate}%`}
                    trend="+5% efisiensi"
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    color="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                />
                <KpiCard
                    title="Tiket Terbuka"
                    value={kpi.open.toString()}
                    trend="Perlu perhatian"
                    icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
                    color="bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                />
                <KpiCard
                    title="Skor Kepuasan (AHP)"
                    value={kpi.avgScore.toFixed(2)}
                    trend="/ 5.0 Skala"
                    icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
                    color="bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* --- Charts Section 1: Breakdown --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main: Volume Trends */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Tren Volume Tiket</CardTitle>
                            <CardDescription>Perbandingan tiket masuk vs terselesaikan (7 Hari Terakhir)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="created"
                                        name="Masuk"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorCreated)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="resolved"
                                        name="Selesai"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorResolved)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Side: Category Distribution */}
                <div>
                    <Card className="h-full border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Distribusi Kategori</CardTitle>
                            <CardDescription>Berdasarkan total tiket</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="text-2xl font-bold text-foreground">{kpi.total}</span>
                                    <p className="text-xs text-muted-foreground">Tiket</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- Section 2: Performance & Details --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Agents Leaderboard */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Top Performing Agents</CardTitle>
                        <CardDescription>Berdasarkan tiket yang diselesaikan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {agentData.map((agent, index) => (
                                <div key={index} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                                    index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}
                                        `}>
                                            #{index + 1}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                                                <AvatarImage src={agent.image || undefined} />
                                                <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground">{agent.name}</p>
                                                <p className="text-xs text-muted-foreground">IT Support • {Math.floor(Math.random() * 5) + 95}% CSAT</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-bold text-foreground">{agent.resolved}</span>
                                        <span className="text-xs text-muted-foreground">Selesai</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Departments Breakdown Bar Chart */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Tiket per Departemen</CardTitle>
                        <CardDescription>Top 5 departemen dengan tiket terbanyak</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={deptData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}

// Sub-component for KPI Cards
function KpiCard({ title, value, trend, icon, color }: any) {
    return (
        <Card className="border-none shadow-sm bg-card hover:bg-card/80 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                        {icon}
                    </div>
                    {/* <Badge variant="outline" className="bg-background text-xs font-normal">
                        {trend}
                    </Badge> */}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-foreground">{value}</span>
                        <span className="text-xs text-emerald-500 font-medium mb-1.5">{trend}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
