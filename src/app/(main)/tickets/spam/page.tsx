"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSystemSettings } from "@/components/settings-provider";

interface SpamTicket {
    id: string;
    ticketNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: string;
    updatedAt: string;
    creator: {
        name: string | null;
        department: string | null;
        image: string | null;
    };
}

export default function SpamTicketsPage() {
    const [tickets, setTickets] = useState<SpamTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatDate } = useSystemSettings();

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/tickets/spam');
            if (response.ok) {
                const data = await response.json();
                setTickets(data);
            }
        } catch (error) {
            console.error("Error fetching spam tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleRestore = async (ticketId: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/restore`, {
                method: 'PATCH',
            });

            if (response.ok) {
                toast.success("Tiket berhasil dipulihkan");
                fetchTickets(); // Refresh list
            } else {
                toast.error("Gagal memulihkan tiket");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async (ticketId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus tiket ini secara permanen?")) {
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success("Tiket berhasil dihapus");
                fetchTickets(); // Refresh list
            } else {
                toast.error("Gagal menghapus tiket");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    return (
        <div className="bg-background min-h-screen p-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-red-100 p-2 rounded-lg dark:bg-red-900/30">
                        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Tiket Spam / Dibatalkan</h1>
                        <p className="text-muted-foreground mt-1">Tiket yang ditandai sebagai spam atau dibatalkan</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />)}
                </div>
            ) : tickets.length === 0 ? (
                <Card className="bg-card border-border">
                    <CardContent className="p-12 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground text-lg font-medium">Tidak ada tiket spam ditemukan</p>
                        <p className="text-muted-foreground/70 text-sm mt-2">Tiket yang dibatalkan akan muncul di sini</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="hover:shadow-lg transition-all duration-300 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <Badge variant="outline" className="font-mono border-red-300 dark:border-red-800 text-foreground">{ticket.ticketNumber}</Badge>
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">
                                    CANCELLED
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <Link href={`/tickets/${ticket.id}`}>
                                        <h3 className="font-semibold text-lg text-foreground line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer">
                                            {ticket.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {ticket.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-red-200 dark:border-red-900 pt-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={ticket.creator.image || `https://ui-avatars.com/api/?name=${ticket.creator.name}&background=random`} />
                                            <AvatarFallback className="text-[10px] font-bold">
                                                {ticket.creator.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{ticket.creator.name}</span>
                                    </div>
                                    <span>{formatDate(ticket.createdAt)}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRestore(ticket.id)}
                                        className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Pulihkan
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDelete(ticket.id)}
                                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Hapus
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
