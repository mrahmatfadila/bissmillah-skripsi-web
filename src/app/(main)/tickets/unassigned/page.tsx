"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle2, Inbox, AlertOctagon, Clock, UserSquare2, TicketIcon } from "lucide-react";
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
    creator: {
        name: string | null;
        department: string | null;
        location: string | null;
    };
}

export default function UnassignedTicketsPage() {
    const { data: session } = useSession();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const { formatDate } = useSystemSettings();

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tickets/unassigned');
            if (response.ok) {
                const data = await response.json();
                setTickets(data);
            } else {
                toast.error("Gagal memuat tiket");
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();

        // Poll for new tickets every 30 seconds
        const interval = setInterval(fetchTickets, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClaim = async (ticketId: string) => {
        try {
            setClaimingId(ticketId);
            const response = await fetch(`/api/tickets/${ticketId}/claim`, {
                method: 'PUT',
            });

            if (response.ok) {
                toast.success("Tiket berhasil diambil alih");
                // Remove from list or refresh
                setTickets(prev => prev.filter(t => t.id !== ticketId));
            } else {
                toast.error("Gagal mengambil tiket, mungkin sudah diambil orang lain.");
            }
        } catch (error) {
            console.error("Error claiming ticket:", error);
            toast.error("Terjadi kesalahan saat mengambil tiket.");
        } finally {
            setClaimingId(null);
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket =>
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.creator.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [tickets, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: tickets.length,
            critical: tickets.filter(t => t.priority === 'CRITICAL').length,
            high: tickets.filter(t => t.priority === 'HIGH').length,
        };
    }, [tickets]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50";
            case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50";
            case "MEDIUM": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
            case "LOW": return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };
    
    const getPriorityBarClass = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-500";
            case "HIGH": return "bg-orange-500";
            case "MEDIUM": return "bg-blue-500";
            case "LOW": return "bg-emerald-500";
            default: return "bg-slate-300";
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-background min-h-screen pb-12">
            {/* Header Banner */}
            <div className="bg-white dark:bg-card border-b border-border px-4 md:px-8 py-6 mb-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <Inbox className="w-6 h-6 text-indigo-600" />
                            Antrean Tiket Masuk
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Tiket di bawah ini belum ditugaskan kepada siapapun. Segera <span className="font-semibold text-slate-700 dark:text-slate-300">Ambil</span> tiket yang sesuai dengan tanggung jawab Anda.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
                
                {/* Stats Overview */}
                {tickets.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <Card className="bg-white dark:bg-card border-none shadow-sm hover:shadow transition-shadow">
                            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-xl">
                                    <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Antrean</p>
                                    <h3 className="text-lg sm:text-2xl font-bold">{stats.total} <span className="text-sm font-normal text-muted-foreground">tiket</span></h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`bg-white dark:bg-card border-none shadow-sm transition-shadow ${stats.critical > 0 ? 'ring-1 ring-red-200 dark:ring-red-900/50 hover:shadow-red-500/10' : 'hover:shadow'}`}>
                            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stats.critical > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse' : 'bg-slate-50 text-slate-400 dark:bg-slate-900/50'}`}>
                                    <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Prioritas Kritikal (URGENT)</p>
                                    <h3 className={`text-lg sm:text-2xl font-bold ${stats.critical > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{stats.critical}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-card p-2 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar gap-1 p-1">
                        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-sm">
                            <TicketIcon className="w-4 h-4 text-slate-500" /> Semua Antrean Baru
                        </div>
                    </div>
                    <div className="w-full md:w-80 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari ID tiket, Judul, atau Nama Pelapor..."
                            className="pl-9 bg-slate-50 dark:bg-background border-none shadow-inner h-9 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tickets List View */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-card/50 rounded-2xl border border-dashed border-border text-center shadow-sm">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                            <p className="text-muted-foreground font-medium">Melacak Tiket Masuk...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-card rounded-2xl border border-dashed border-border text-center shadow-sm">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-5">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                {searchQuery ? "Tiket Tidak Ditemukan" : "Semua Antrean Bersih!"}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                                {searchQuery 
                                    ? "Coba gunakan kata kunci berbeda pada pencarian Anda."
                                    : "Luar biasa! Tidak ada tiket baru yang menunggu untuk ditangani saat ini."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTickets.map((ticket) => {
                                const isCritical = ticket.priority === 'CRITICAL';
                                
                                return (
                                    <div key={ticket.id} className={`bg-white dark:bg-card p-5 sm:p-6 rounded-2xl border shadow-sm transition-all relative flex flex-col md:flex-row gap-5 md:gap-6 group hover:shadow-md ${isCritical ? 'border-red-200 dark:border-red-900/50 hover:border-red-400' : 'border-border/50 hover:border-indigo-300 dark:hover:border-indigo-800'}`}>
                                        
                                        {/* Status Left Banner Overlay */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all group-hover:w-2 ${getPriorityBarClass(ticket.priority)}`} />
                                        
                                        {/* Main Content Area */}
                                        <div className="flex-[3] pl-2 sm:pl-1 flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="text-xs font-bold font-mono tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                                    {ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}
                                                </span>
                                                <Badge variant="outline" className={`border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </Badge>
                                                {ticket.category && (
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                                                        {ticket.category.replace(/_/g, " ")}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${isCritical ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {ticket.title}
                                            </h3>
                                            
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                {ticket.description}
                                            </p>
                                            
                                            <div className="flex items-center gap-3 mt-auto">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 py-1.5 px-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <UserSquare2 className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{ticket.creator.name || 'Unknown'}</span>
                                                    <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">{ticket.creator.department || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta & Actions Sidebar */}
                                        <div className="flex-1 flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                                            
                                            <div className="text-left md:text-right w-full mb-0 md:mb-6">
                                                <div className="flex items-center gap-1.5 justify-start md:justify-end text-xs text-slate-500 mb-1 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{formatDate(ticket.createdAt)}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: id })}
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                className={`w-full md:w-auto min-w-[120px] h-11 rounded-xl shadow-md font-semibold transition-all hover:scale-105 active:scale-95 ${isCritical ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}
                                                onClick={() => handleClaim(ticket.id)}
                                                disabled={claimingId === ticket.id}
                                            >
                                                {claimingId === ticket.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5" /> Ambil Tiket
                                                    </span>
                                                )}
                                            </Button>

                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
