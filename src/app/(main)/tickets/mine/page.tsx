"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Loader2, Ticket as TicketIcon, AlertCircle, Activity, CheckCircle2, MessageSquare, CalendarDays, Clock, ListFilter } from "lucide-react";
import Link from "next/link";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { toast } from "sonner";
import { useSystemSettings } from "@/components/settings-provider";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Ticket {
    id: string;
    ticketNumber?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: string;
    _count?: {
        comments: number;
    };
}

export default function MyTicketsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED">("ALL");
    const { formatDate } = useSystemSettings();

    const categoryParam = searchParams.get('category');
    const createParam = searchParams.get('create');

    useEffect(() => {
        if (createParam === 'true') {
            setIsCreateOpen(true);
        }
    }, [createParam]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tickets/mine');
            if (response.ok) {
                const data = await response.json();
                setTickets(data);
            } else {
                toast.error("Gagal memuat tiket Anda");
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const stats = useMemo(() => {
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'OPEN').length,
            pending: tickets.filter(t => t.status === 'PENDING').length,
            progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
            resolved: tickets.filter(t => t.status === 'RESOLVED').length,
            closed: tickets.filter(t => t.status === 'CLOSED').length,
            cancelled: tickets.filter(t => t.status === 'CANCELLED').length,
        };
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        let result = tickets;
        
        // Apply Tab Filter
        if (activeTab === 'OPEN') {
            result = result.filter(t => t.status === 'OPEN');
        } else if (activeTab === 'IN_PROGRESS') {
            result = result.filter(t => t.status === 'IN_PROGRESS');
        } else if (activeTab === 'RESOLVED') {
            result = result.filter(t => t.status === 'RESOLVED');
        } else if (activeTab === 'CLOSED') {
            result = result.filter(t => t.status === 'CLOSED');
        } else if (activeTab === 'CANCELLED') {
            result = result.filter(t => t.status === 'CANCELLED');
        }

        // Apply Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.title.toLowerCase().includes(q) || 
                (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
                t.id.toLowerCase().includes(q)
            );
        }

        return result;
    }, [tickets, activeTab, searchQuery]);

    const getStatusUI = (status: string) => {
        switch (status) {
            case "OPEN": return { color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Terbuka" };
            case "PENDING": return { color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", icon: <Clock className="w-3 h-3 mr-1" />, label: "Tertunda" };
            case "IN_PROGRESS": return { color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", icon: <Activity className="w-3 h-3 mr-1" />, label: "Di Proses" };
            case "RESOLVED": return { color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800", icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: "Selesai" };
            case "CLOSED": return { color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: "Ditutup" };
            case "CANCELLED": return { color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", icon: <AlertCircle className="w-3 h-3 mr-1" />, label: "Dibatalkan" };
            default: return { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <AlertCircle className="w-3 h-3 mr-1" />, label: status };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50";
            case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50";
            case "MEDIUM": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
            case "LOW": return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-background min-h-screen pb-12">
            {/* Header Banner */}
            <div className="bg-white dark:bg-card border-b border-border px-4 md:px-8 py-6 mb-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <TicketIcon className="w-6 h-6 text-blue-600" />
                            Tiket Saya
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Kelola dan pantau status penyelesaian permintaan bantuan Anda.</p>
                    </div>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 shadow-md text-white font-medium"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Tiket Baru
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
                
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl">
                                <TicketIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tiket</p>
                                <h3 className="text-lg sm:text-2xl font-bold">{stats.total}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl">
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Terbuka</p>
                                <h3 className="text-lg sm:text-2xl font-bold">{stats.open}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl">
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Di Proses</p>
                                <h3 className="text-lg sm:text-2xl font-bold">{stats.progress}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-xl">
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Selesai</p>
                                <h3 className="text-lg sm:text-2xl font-bold">{stats.resolved}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar gap-1 p-1">
                        {[
                            { id: "ALL", label: "Semua Tiket" },
                            { id: "OPEN", label: "Terbuka", count: stats.open },
                            { id: "IN_PROGRESS", label: "Di Proses", count: stats.progress },
                            { id: "PENDING", label: "Tertunda", count: stats.pending },
                            { id: "RESOLVED", label: "Selesai", count: stats.resolved },
                            { id: "CLOSED", label: "Ditutup", count: stats.closed },
                            { id: "CANCELLED", label: "Dibatalkan", count: stats.cancelled },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm" 
                                        : "text-muted-foreground hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800/50"
                                }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="w-full md:w-72 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari ID tiket atau Judul..."
                            className="pl-9 bg-slate-50 dark:bg-background border-none shadow-inner h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tickets List View */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-card/50 rounded-2xl border border-dashed border-border">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-muted-foreground">Memuat Data Tiket...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card rounded-2xl border border-dashed border-border text-center shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <TicketIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {searchQuery ? "Tiket Tidak Ditemukan" : "Belum Ada Tiket"}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                                {searchQuery 
                                    ? "Coba gunakan kata kunci berbeda atau hapus filter pencarian."
                                    : "Anda belum membuat tiket permintaan bantuan. Klik tombol di bawah untuk membuat tiket pertama Anda."}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" /> Buat Tiket Sekarang
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTickets.map((ticket) => {
                                const statusUI = getStatusUI(ticket.status);
                                
                                return (
                                    <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="group outline-none">
                                        <div className="bg-white dark:bg-card p-5 sm:p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 group-focus-visible:ring-2 focus-visible:ring-blue-500">
                                            
                                            {/* Status Left Banner Overlay */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-800 transition-colors group-hover:bg-blue-400" />
                                            
                                            <div className="flex-[3] flex flex-col justify-center pl-2 sm:pl-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <span className="text-xs font-bold font-mono tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        {ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}
                                                    </span>
                                                    <Badge variant="outline" className={`border text-xs px-2.5 py-0.5 rounded-full ${statusUI.color}`}>
                                                        {statusUI.icon} {statusUI.label}
                                                    </Badge>
                                                    <Badge variant="outline" className={`border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </Badge>
                                                    {ticket.category && (
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                                                            {ticket.category.replace(/_/g, " ")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <h3 className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                    {ticket.title}
                                                </h3>
                                                
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pr-4">
                                                    {ticket.description}
                                                </p>
                                            </div>

                                            {/* Meta Sidebar */}
                                            <div className="flex-1 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-border/50 pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-semibold">{ticket._count?.comments || 0}</span>
                                                    <span>Tanggapan</span>
                                                </div>
                                                
                                                <div className="text-right sm:mt-3">
                                                    <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500 mb-1">
                                                        <CalendarDays className="w-3 h-3 text-slate-400" />
                                                        <span>{formatDate(ticket.createdAt)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: id })}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <CreateTicketDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchTickets}
                defaultCategory={categoryParam || undefined}
            />
        </div>
    );
}
