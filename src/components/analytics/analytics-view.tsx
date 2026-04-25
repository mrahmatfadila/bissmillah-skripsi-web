"use client";

import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, TrendingUp, Users, Activity, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSystemSettings } from "@/components/settings-provider";

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
    const isSPV = user?.role === 'SUPERVISOR_SHOP';
    
    const pageTitle = isSPV ? "Laporan Aktivitas & Tiket Toko" : "Laporan Analitik & Performa IT";
    const pageSubtitle = isSPV 
        ? "Ringkasan status resolusi tiket yang diajukan oleh departemen Anda dalam 7 hari terakhir." 
        : "Ringkasan metrik sistem menyeluruh, efisiensi agen pendukung, dan tren tiket harian.";

    // Handlers
    const handleShare = async () => {
        const shareData = {
            title: pageTitle,
            text: `Laporan Analitik: Total Tiket ${kpi.total}, Penyelesaian ${Math.round((kpi.total > 0 ? kpi.resolved / kpi.total : 0) * 100)}%`,
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
        doc.setFillColor(15, 23, 42); // slate-900 (Premium dark header)
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(pageTitle, 14, 20);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Internal Ticketing System", 14, 28);

        doc.setFontSize(9);
        doc.text(`Tanggal: ${formatDate(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 20, { align: 'right' });
        doc.text(`Dicetak Oleh: ${user?.name || "User"} (${user?.role})`, pageWidth - 14, 28, { align: 'right' });

        let currentY = 50;

        // --- Summary Text ---
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Ringkasan Eksekutif", 14, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const resolutionRate = kpi.total > 0 ? Math.round((kpi.resolved / kpi.total) * 100) : 0;
        
        let summaryText = "";
        if (isSPV) {
            summaryText = `Berdasarkan aktivitas pengajuan tiket dari toko/departemen Anda, terdapat total ${kpi.total} tiket yang tercatat. Sebanyak ${kpi.resolved} tiket telah berhasil diselesaikan oleh Tim IT, dengan tingkat penyelesaian mencapai ${resolutionRate}%. Skor rata-rata AHP (Urgensi) untuk tiket Anda adalah ${kpi.avgScore.toFixed(2)}.`;
        } else {
            summaryText = `Melalui data operasional saat ini, terdapat ${kpi.total} tiket yang masuk ke sistem. Sebanyak ${kpi.resolved} tiket telah berhasil diselesaikan dengan resolution rate sebesar ${resolutionRate}%. Skor rata-rata prioritas AHP tingkat keseluruhan mencapai ${kpi.avgScore.toFixed(2)} dari skala 5.00.`;
        }

        const splitText = doc.splitTextToSize(summaryText, pageWidth - 28);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 5) + 8;

        // --- KPI Metrics ---
        const metrics = [
            { label: "Total Tiket", value: kpi.total.toString(), color: [59, 130, 246] as [number, number, number] },
            { label: "Diselesaikan", value: kpi.resolved.toString(), color: [16, 185, 129] as [number, number, number] },
            { label: "Dalam Proses", value: kpi.open.toString(), color: [245, 158, 11] as [number, number, number] },
            { label: "Dibatalkan", value: kpi.canceled.toString(), color: [239, 68, 68] as [number, number, number] },
            { label: "Skor Avg AHP", value: kpi.avgScore.toFixed(2), color: [139, 92, 246] as [number, number, number] },
            { label: "Resolution Rate", value: `${resolutionRate}%`, color: [14, 165, 233] as [number, number, number] },
        ];

        const cardWidth = (pageWidth - 28 - 10) / 3;
        const cardHeight = 22;
        let cardX = 14;
        let cardY = currentY;

        metrics.forEach((metric, index) => {
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

            doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.rect(cardX, cardY, 3, cardHeight, 'F');

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(metric.value, cardX + 8, cardY + 12);

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(metric.label, cardX + 8, cardY + 18);

            cardX += cardWidth + 5;
            if ((index + 1) % 3 === 0) {
                cardX = 14;
                cardY += cardHeight + 5;
            }
        });

        currentY = cardY;
        doc.setTextColor(30, 41, 59);

        // --- Table Config ---
        const commonTableStyles = {
            headStyles: { fillColor: [241, 245, 249] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], fontStyle: 'bold' as 'bold', lineWidth: 0.1, lineColor: [226, 232, 240] as [number, number, number] },
            bodyStyles: { textColor: [51, 65, 85] as [number, number, number] },
            alternateRowStyles: { fillColor: [250, 250, 252] as [number, number, number] },
            theme: 'grid' as 'grid',
            styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] as [number, number, number], lineWidth: 0.1 },
            margin: { left: 14, right: 14 }
        };

        const renderSectionTitle = (title: string, yPos: number) => {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(title, 14, yPos);
            doc.setDrawColor(226, 232, 240);
            doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
            return yPos + 8;
        };

        currentY += 10;

        // 1. Departemen Table (Label subtly changes based on role)
        currentY = renderSectionTitle(isSPV ? "Volume Tiket Area Toko Anda" : "Distribusi Berdasarkan Departemen Asal", currentY);
        autoTable(doc, {
            ...commonTableStyles,
            startY: currentY,
            head: [[isSPV ? 'Sumber Divisi' : 'Departemen Asal', 'Total Tiket Masuk']],
            body: deptData.map((d: any) => [d.name, d.value.toString()]),
            columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;

        // 2. Kategori Table
        currentY = renderSectionTitle("Rincian Kategori Layanan", currentY);
        autoTable(doc, {
            ...commonTableStyles,
            startY: currentY,
            head: [['Kategori Masalah', 'Jumlah Kejadian']],
            body: categoryData.map((c: any) => [c.name.replace(/_/g, ' '), c.value.toString()]),
            columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;

        // 3. Agents Table (Only if Not SPV)
        if (!isSPV && agentData.length > 0) {
            if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }
            currentY = renderSectionTitle("Performa Agen Pendukung IT", currentY);
            autoTable(doc, {
                ...commonTableStyles,
                startY: currentY,
                head: [['Nama Agen / Petugas IT', 'Tiket Diselesaikan']],
                body: agentData.map((a: any) => [a.name, a.resolved.toString()]),
                columnStyles: { 1: { halign: 'center', cellWidth: 50 } }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(148, 163, 184);
            doc.text('Dokumen Sistem Otomatis - IT Ticketing', 14, pageHeight - 10);
            doc.text(`Hal ${i} / ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }

        doc.save(`Laporan_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF Laporan Berhasil Dibuat");
    };

    const resolutionRate = kpi.total > 0 ? Math.round((kpi.resolved / kpi.total) * 100) : 0;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 p-4 sm:p-6 space-y-8 pb-20 animate-in fade-in duration-500">

            {/* --- Premium Hero Header --- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xlprint:hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <Activity className="w-64 h-64 text-blue-400" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Badge variant="outline" className={`mb-4 px-3 py-1 text-xs border bg-opacity-20 backdrop-blur-md ${isSPV ? 'text-indigo-300 border-indigo-400/30 bg-indigo-500/20' : 'text-blue-300 border-blue-400/30 bg-blue-500/20'}`}>
                            {isSPV ? "Panel Kinerja Toko" : "Dashboard Manajemen IT"}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            {pageTitle}
                        </h1>
                        <p className="text-slate-300 mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
                            {pageSubtitle}
                        </p>
                    </div>
                    <div className="flex sm:flex-col lg:flex-row items-center gap-3 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
                        <Button variant="ghost" className="gap-2 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl w-full sm:w-auto" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                            Bagikan
                        </Button>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-none rounded-xl w-full sm:w-auto transition-all" onClick={handleExportPDF}>
                            <FileText className="w-4 h-4" />
                            Unduh PDF
                        </Button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden, header, nav, aside { display: none !important; }
                    .min-h-screen { min-height: auto; padding: 0 !important; background: white !important; }
                    .shadow-2xl, .shadow-sm, .shadow-lg { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
                }
            `}</style>

            {/* --- KPI Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <KpiCard
                    title={isSPV ? "Tiket Dibuat" : "Total Tiket Masuk"}
                    value={kpi.total.toString()}
                    trend="+12% bulan ini"
                    icon={<Activity className="w-6 h-6 text-blue-500" />}
                    color="bg-gradient-to-br from-blue-500/20 to-blue-500/5"
                    border="border-blue-200/50 dark:border-blue-900/30"
                />
                <KpiCard
                    title="Tingkat Penyelesaian"
                    value={`${resolutionRate}%`}
                    trend="Rata-rata 24 jam"
                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    color="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
                    border="border-emerald-200/50 dark:border-emerald-900/30"
                />
                <KpiCard
                    title={isSPV ? "Tiket Menunggu" : "Masih Proses / Open"}
                    value={kpi.open.toString()}
                    trend="Belum ditangani"
                    icon={<AlertCircle className="w-6 h-6 text-amber-500" />}
                    color="bg-gradient-to-br from-amber-500/20 to-amber-500/5"
                    border="border-amber-200/50 dark:border-amber-900/30"
                />
                <KpiCard
                    title="Skor AHP Rata-rata"
                    value={kpi.avgScore.toFixed(2)}
                    trend="Skala 5.0"
                    icon={<TrendingUp className="w-6 h-6 text-indigo-500" />}
                    color="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5"
                    border="border-indigo-200/50 dark:border-indigo-900/30"
                />
            </div>

            {/* --- Charts Section 1: Breakdown --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main: Volume Trends */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-slate-200/60 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                            <CardTitle className="text-lg">Tren Volume Harian (7 Hari)</CardTitle>
                            <CardDescription>Grafik kuantitas tiket {isSPV ? "Anda" : "seluruh departemen"}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px] pt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.6} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 500 }}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="created"
                                        name="Masuk/Dibuat"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorCreated)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="resolved"
                                        name="Diselesaikan"
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
                    <Card className="h-full border-slate-200/60 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                            <CardTitle className="text-lg">Sebaran Kategori</CardTitle>
                            <CardDescription>Berdasarkan {isSPV ? "tiket anda" : "volume total"}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px] relative pt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={65}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="transparent"
                                        cornerRadius={4}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: 600 }} itemStyle={{ color: 'var(--foreground)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-[40px]">
                                <div className="text-center">
                                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{categoryData.length > 0 ? kpi.total : 0}</span>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- Section 2: Conditional Performance & Details --- */}
            <div className={`grid grid-cols-1 ${!isSPV ? 'lg:grid-cols-2' : ''} gap-6`}>

                {/* Top Agents Leaderboard (ONLY FOR IT_SUPPORT) */}
                {!isSPV && (
                    <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Peringkat Efisiensi Agen
                            </CardTitle>
                            <CardDescription>Produktivitas petugas penyelesaian tiket</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-5">
                                {agentData.map((agent, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                flex items-center justify-center w-9 h-9 rounded-full font-black text-sm shadow-sm
                                                ${index === 0 ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 ring-2 ring-yellow-400/20' :
                                                    index === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-2 ring-slate-400/20' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 ring-2 ring-orange-400/20' :
                                                            'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
                                            `}>
                                                #{index + 1}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-11 w-11 shadow-sm border border-white dark:border-slate-800">
                                                    <AvatarImage src={agent.image || undefined} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{agent.name}</p>
                                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded shadow-sm mt-0.5">Pendukung Utama</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-black text-slate-800 dark:text-slate-100">{agent.resolved}</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Selesai</span>
                                        </div>
                                    </div>
                                ))}
                                {agentData.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">Belum ada agen yang menyelesaikan tiket.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Departments Breakdown Bar Chart */}
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4 bg-slate-50/50 dark:bg-slate-900/20">
                        <CardTitle className="text-lg">Tiket per area</CardTitle>
                        <CardDescription>{isSPV ? "Frekuensi gangguan di toko Anda" : "5 Divisi pelapor terbanyak"}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={deptData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" opacity={0.4} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={120}
                                    tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--foreground)' }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
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
function KpiCard({ title, value, trend, icon, color, border }: any) {
    return (
        <Card className={`relative overflow-hidden border ${border} shadow-sm bg-white dark:bg-slate-950 hover:shadow-md transition-all duration-300 group`}>
            {/* Subtle light effect top right */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full filter blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${color}`}></div>
            
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{title}</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
                        <span className="text-xs text-slate-400 font-medium mb-2 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">{trend}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
