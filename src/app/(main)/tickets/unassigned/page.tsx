"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSystemSettings } from "@/components/settings-provider";

interface Ticket {
    id: string;
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
                console.error("Failed to fetch tickets");
                toast.error("Failed to load tickets");
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
                toast.success("Ticket claimed successfully");
                // Remove from list or refresh
                setTickets(prev => prev.filter(t => t.id !== ticketId));
            } else {
                toast.error("Failed to claim ticket");
            }
        } catch (error) {
            console.error("Error claiming ticket:", error);
            toast.error("Error claiming ticket");
        } finally {
            setClaimingId(null);
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.creator.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-200 text-red-800";
            case "HIGH": return "bg-red-100 text-red-700";
            case "MEDIUM": return "bg-orange-100 text-orange-700";
            case "LOW": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tiket Belum Ditugaskan</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola dan tugaskan tiket masuk
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Cari tiket..."
                            className="pl-9 bg-background w-full h-10 rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Ticket List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <p>Tidak ada tiket yang belum ditugaskan ditemukan.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredTickets.map((ticket: any) => (
                                    <div key={ticket.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="mt-1">
                                                <div className={`w-2 h-12 rounded-full ${ticket.priority === 'CRITICAL' ? 'bg-red-500' :
                                                    ticket.priority === 'HIGH' ? 'bg-orange-500' :
                                                        ticket.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-green-500'
                                                    }`} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">#{ticket.id.slice(-6).toUpperCase()}</span>
                                                    <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {formatDate(ticket.createdAt)}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <span className="text-xs text-muted-foreground">{ticket.creator.name} ({ticket.creator.department})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <Button
                                                size="sm"
                                                onClick={() => handleClaim(ticket.id)}
                                                disabled={claimingId === ticket.id}
                                            >
                                                {claimingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                {claimingId === ticket.id ? 'Mengambil...' : 'Ambil'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && filteredTickets.length === 0 && (
                            <div className="text-center py-16 bg-muted rounded-lg border border-dashed border-border">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-foreground">Semua Beres!</h3>
                                <p className="text-muted-foreground">Tidak ada tiket yang menunggu untuk departemen Anda.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
