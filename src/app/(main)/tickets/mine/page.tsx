"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { toast } from "sonner";
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
    const { formatDate } = useSystemSettings();

    const categoryParam = searchParams.get('category');
    const createParam = searchParams.get('create');

    useEffect(() => {
        if (createParam === 'true') {
            setIsCreateOpen(true);
            // Optional: Clean up URL after opening
            // router.replace('/tickets/mine', { scroll: false });
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
                console.error("Failed to fetch tickets");
                toast.error("Failed to load your tickets");
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

    const filteredTickets = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
        <div className="bg-background min-h-screen p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Tiket Saya
                    </h1>
                    <p className="text-muted-foreground mt-1">Lacak dan kelola permintaan Anda</p>
                </div>
                <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Tiket
                </Button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari tiket..."
                    className="pl-10 h-10 bg-card border-border text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Semua Tiket ({filteredTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTickets.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
                                    <p>Tidak ada tiket yang cocok dengan pencarian Anda.</p>
                                    <Button
                                        className="mt-4"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Buat Tiket Pertama Anda
                                    </Button>
                                </div>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={`/tickets/${ticket.id}`}
                                        className="block"
                                    >
                                        <div className="p-5 border border-border rounded-lg hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-card">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
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
                                                    </div>
                                                    <h3 className="font-bold text-foreground mb-2 text-lg">{ticket.title}</h3>

                                                    {/* Request Permasalahan Preview */}
                                                    <div className="mb-3">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase">Request Permasalahan:</span>
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 bg-muted/50 p-2 rounded border-l-2 border-blue-400">
                                                            {ticket.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                            </svg>
                                                            {ticket._count?.comments || 0} Balasan
                                                        </span>
                                                        <span>
                                                            Dibuat: {formatDate(ticket.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateTicketDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchTickets}
                defaultCategory={categoryParam || undefined}
            />
        </div>
    );
}
