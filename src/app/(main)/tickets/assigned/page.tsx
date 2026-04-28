"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Search, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useSystemSettings } from "@/components/settings-provider";
import { translateStatus } from "@/lib/utils";

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: string;
    ahpScore: number | null;
    creator: {
        name: string | null;
        department: string | null;
        image: string | null;
    };
}

export default function AssignedTicketsPage() {
    const { data: session } = useSession();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const { formatDate } = useSystemSettings();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Fetch tickets where assigneeId = current user
                // Reuse 'mine' endpoint? No, 'mine' is creatorId. 
                // We need a specific endpoint or use filtering. 
                // Let's assume we'll create /api/tickets/assigned endpoint.
                const response = await fetch('/api/tickets/assigned');
                if (response.ok) {
                    const data = await response.json();
                    setTickets(data);
                }
            } catch (error) {
                console.error("Error fetching assigned tickets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // Helper colors...
    const getPriorityColor = (p: string) => p === "HIGH" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const statusMatch = filterStatus === 'ALL' || ticket.status === filterStatus;
        const priorityMatch = filterPriority === 'ALL' || ticket.priority === filterPriority;
        return statusMatch && priorityMatch;
    });

    // Group tickets by status
    const groupedTickets = filteredTickets.reduce((acc, ticket) => {
        const status = ticket.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(ticket);
        return acc;
    }, {} as Record<string, Ticket[]>);

    // Status order and labels
    const statusConfig = [
        { key: 'OPEN', label: 'Terbuka', color: 'bg-blue-500', count: groupedTickets['OPEN']?.length || 0 },
        { key: 'IN_PROGRESS', label: 'Di Proses', color: 'bg-orange-500', count: groupedTickets['IN_PROGRESS']?.length || 0 },
        { key: 'PENDING', label: 'Tertunda', color: 'bg-purple-500', count: groupedTickets['PENDING']?.length || 0 },
        { key: 'RESOLVED', label: 'Selesai', color: 'bg-green-500', count: groupedTickets['RESOLVED']?.length || 0 },
        { key: 'CLOSED', label: 'Ditutup', color: 'bg-gray-500', count: groupedTickets['CLOSED']?.length || 0 },
        { key: 'CANCELLED', label: 'Dibatalkan', color: 'bg-red-500', count: groupedTickets['CANCELLED']?.length || 0 },
    ];

    return (
        <div className="bg-background min-h-screen p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Tiket Tugas Saya
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Tiket yang ditugaskan kepada Anda</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {statusConfig.map(status => (
                        <div key={status.key} className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.color}`}></div>
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{status.label}</span>
                            <span className="text-xs font-bold text-foreground">{status.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-6 bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">Filter:</span>
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="ALL">Semua Status</option>
                    <option value="OPEN">Terbuka</option>
                    <option value="IN_PROGRESS">Di Proses</option>
                    <option value="PENDING">Tertunda</option>
                    <option value="RESOLVED">Selesai</option>
                    <option value="CLOSED">Ditutup</option>
                    <option value="CANCELLED">Dibatalkan</option>
                </select>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="ALL">Semua Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
                {(filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
                    <button
                        onClick={() => {
                            setFilterStatus('ALL');
                            setFilterPriority('ALL');
                        }}
                        className="w-full sm:w-auto px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap text-left sm:text-center"
                    >
                        Reset Filter
                    </button>
                )}
                <div className="sm:ml-auto w-full sm:w-auto text-sm text-muted-foreground whitespace-nowrap">
                    Menampilkan <span className="font-bold text-foreground">{filteredTickets.length}</span> dari <span className="font-bold text-foreground">{tickets.length}</span> tiket
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />)}
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
                    <p>{tickets.length === 0 ? 'Tidak ada tiket yang ditugaskan ditemukan.' : 'Tidak ada tiket yang sesuai dengan filter.'}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {statusConfig.map(statusInfo => {
                        const statusTickets = groupedTickets[statusInfo.key] || [];
                        if (statusTickets.length === 0) return null;

                        return (
                            <div key={statusInfo.key}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-1 h-8 rounded-full ${statusInfo.color}`}></div>
                                    <h2 className="text-xl font-bold text-foreground">{statusInfo.label}</h2>
                                    <span className="text-sm text-muted-foreground">({statusTickets.length} tiket)</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {statusTickets.map((ticket) => (
                                        <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                                            <Card className="hover:shadow-lg transition-all duration-300 border-border group cursor-pointer bg-card">
                                                <CardHeader className="flex flex-row flex-wrap items-start sm:items-center justify-between pb-2 gap-2">
                                                    <Badge variant="outline" className="font-mono">{ticket.id.slice(-6).toUpperCase()}</Badge>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className={`whitespace-nowrap ${ticket.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                                                            ticket.priority === 'HIGH' ? 'bg-red-500 text-white' :
                                                                ticket.priority === 'MEDIUM' ? 'bg-orange-500 text-white' :
                                                                    'bg-green-500 text-white'
                                                            }`}>
                                                            {ticket.priority}
                                                        </Badge>
                                                        <Badge className={`whitespace-nowrap ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                                            ticket.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                                                            ticket.status === 'PENDING' ? 'bg-purple-100 text-purple-700' :
                                                            ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                                                            ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                                    'bg-green-100 text-green-700'
                                                            }`}>
                                                            {translateStatus(ticket.status)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-blue-600 transition-colors flex-1">
                                                                {ticket.title}
                                                            </h3>
                                                            {ticket.ahpScore !== null && ticket.ahpScore !== undefined && (
                                                                <div className="ml-2 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">AHP</span>
                                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{Number(ticket.ahpScore).toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-2">
                                                            <span className="text-xs font-semibold text-muted-foreground uppercase">Request Permasalahan:</span>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3 bg-muted/50 p-2 rounded border-l-2 border-blue-400">
                                                                {ticket.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border pt-4">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={ticket.creator.image || `https://ui-avatars.com/api/?name=${ticket.creator.name}&background=random`} />
                                                                <AvatarFallback className="text-[10px] font-bold">
                                                                    {ticket.creator.name?.substring(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate max-w-[120px] sm:max-w-[150px]">{ticket.creator.name}</span>
                                                        </div>
                                                        <span className="whitespace-nowrap">{formatDate(ticket.createdAt)}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
