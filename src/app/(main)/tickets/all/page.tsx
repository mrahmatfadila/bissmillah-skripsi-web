"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Loader2, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSystemSettings } from "@/components/settings-provider";

interface Ticket {
    id: string;
    ticketNumber?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: string;
    updatedAt: string;
    creator: {
        name: string | null;
        image: string | null;
        department: string | null;
    };
    assignee: {
        name: string | null;
        image: string | null;
    } | null;
    _count?: {
        comments: number;
    };
}

export default function AllTicketsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const { formatDate, settings } = useSystemSettings();

    // Update URL when search changes (optional but good for UX)
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (searchQuery) {
            params.set("search", searchQuery);
        } else {
            params.delete("search");
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [searchQuery, router, searchParams]);

    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ticketsRes, notifRes] = await Promise.all([
                fetch('/api/tickets/all'),
                fetch('/api/notifications')
            ]);

            if (ticketsRes.ok && notifRes.ok) {
                const ticketsData = await ticketsRes.json();
                const notifData = await notifRes.json();

                setTickets(ticketsData);
                setNotifications(notifData);
            } else {
                console.error("Failed to fetch data");
                toast.error("Failed to load data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll for updates
        const interval = setInterval(fetchData, 30000);

        // Listen for refresh triggers
        const handleRefresh = () => fetchData();
        window.addEventListener('ticket-stats-refresh', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('ticket-stats-refresh', handleRefresh);
        };
    }, []);

    const getUnreadCount = (ticketId: string) => {
        return notifications.filter(n => n.ticketId === ticketId && !n.read && n.type === 'COMMENT').length;
    };

    const filteredAndSortedTickets = tickets
        .filter(ticket =>
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ticket.creator.name && ticket.creator.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ticket.creator.department && ticket.creator.department.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a, b) => {
            const unreadA = getUnreadCount(a.id);
            const unreadB = getUnreadCount(b.id);

            // Prioritize tickets with unread comments
            if (unreadA > 0 && unreadB === 0) return -1;
            if (unreadB > 0 && unreadA === 0) return 1;
            // Then sort by most recent unread? Or just normal date sorting?
            // "berada di paling atas"
            return 0; // Keep existing sort (descending createdAt from API)
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-100 text-blue-700";
            case "IN_PROGRESS": return "bg-yellow-100 text-yellow-700";
            case "RESOLVED": return "bg-green-100 text-green-700";
            case "CLOSED": return "bg-gray-100 text-gray-700";
            case "PENDING": return "bg-purple-100 text-purple-700";
            case "CANCELLED": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-200 text-red-800";
            case "HIGH": return "bg-red-100 text-red-700";
            case "MEDIUM": return "bg-orange-100 text-orange-700";
            case "LOW": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getSlaStatus = (ticket: any, status: string) => {
        if (!settings?.sla?.enabled) return null;

        let allocatedHours = 24;
        if (ticket.priority === 'CRITICAL') allocatedHours = settings.sla.criticalHours || 2;
        if (ticket.priority === 'HIGH') allocatedHours = settings.sla.highHours || 8;
        if (ticket.priority === 'MEDIUM') allocatedHours = settings.sla.mediumHours || 24;
        if (ticket.priority === 'LOW') allocatedHours = settings.sla.lowHours || 72;

        const createdAt = new Date(ticket.createdAt).getTime();
        const targetTime = createdAt + (allocatedHours * 60 * 60 * 1000);
        const now = new Date().getTime();

        if (status === 'RESOLVED' || status === 'CLOSED' || status === 'CANCELLED') {
            const updatedAt = new Date(ticket.updatedAt).getTime();
            if (updatedAt > targetTime && status !== 'CANCELLED') {
                return { text: "SLA Terlewati", color: "bg-red-100 text-red-700 border-red-200" };
            } else if (status !== 'CANCELLED') {
                return { text: "SLA Terpenuhi", color: "bg-green-100 text-green-700 border-green-200" };
            }
            return null;
        }

        const remainingMs = targetTime - now;
        if (remainingMs < 0) {
            return { text: `SLA Telat`, color: "bg-red-100 text-red-800 border-red-300 animate-pulse" };
        }

        const elapsedMs = now - createdAt;
        const totalMs = allocatedHours * 60 * 60 * 1000;
        const warningThresholdPercent = settings.sla.warningThreshold || 75;

        if ((elapsedMs / totalMs) * 100 >= warningThresholdPercent) {
            return { text: "SLA Warning", color: "bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse" };
        }

        return { text: "SLA Aman", color: "bg-green-100 text-green-700 border-green-200" };
    };

    return (
        <div className="bg-background min-h-screen p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 sm:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Semua Tiket
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Daftar semua tiket dalam sistem</p>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Tiket
                </Button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari tiket berdasarkan judul, nomor, atau pembuat..."
                    className="pl-10 h-10 bg-card border-border text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Daftar Tiket ({filteredAndSortedTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAndSortedTickets.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
                                    <p>Tidak ada tiket yang ditemukan.</p>
                                </div>
                            ) : (
                                filteredAndSortedTickets.map((ticket) => {
                                    const unreadCount = getUnreadCount(ticket.id);
                                    return (
                                        <Link
                                            key={ticket.id}
                                            href={`/tickets/${ticket.id}`}
                                            className="block"
                                        >
                                            <div className="p-5 border border-border rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-card group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="text-sm font-mono font-semibold text-blue-600">
                                                                {ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}
                                                            </span>
                                                            <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                                                                {ticket.status.replace(/_/g, " ")}
                                                            </Badge>
                                                            <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                                                                {ticket.priority}
                                                            </Badge>
                                                            {ticket.category && (
                                                                <Badge variant="outline" className="text-muted-foreground border-border">
                                                                    {ticket.category.replace(/_/g, " ")}
                                                                </Badge>
                                                            )}
                                                            {(() => {
                                                                const sla = getSlaStatus(ticket, ticket.status);
                                                                if (!sla) return null;
                                                                return (
                                                                    <Badge variant="outline" className={`ml-2 ${sla.color}`}>
                                                                        <Clock className="w-3 h-3 mr-1 inline-block" />
                                                                        {sla.text}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-bold text-foreground mb-2 text-lg group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
                                                            {unreadCount > 0 && (
                                                                <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center shadow-lg animate-pulse">
                                                                    {unreadCount} Chat Baru
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={ticket.creator.image || undefined} />
                                                                    <AvatarFallback>{ticket.creator.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{ticket.creator.name}</span>
                                                            </div>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" />
                                                                {ticket._count?.comments || 0} Balasan
                                                            </span>
                                                            <span>
                                                                {formatDate(ticket.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateTicketDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchData}
            />
        </div >
    );
}
