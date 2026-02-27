"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User } from "lucide-react";
import { useSystemSettings } from "@/components/settings-provider";

interface Ticket {
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    creator: {
        name: string | null;
        department: string | null;
    };
}

export default function StatusTicketPage() {
    const params = useParams();
    const rawStatus = params.status as string; // e.g., 'new', 'open'
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatDate } = useSystemSettings();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Pass raw status to API which handles mapping
                const res = await fetch(`/api/tickets/search?status=${rawStatus}`);
                if (res.ok) {
                    setTickets(await res.json());
                }
            } catch (e) { console.error(e) }
            setLoading(false);
        };
        fetchTickets();
    }, [rawStatus]);

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "CRITICAL": return "bg-red-200 text-red-800";
            case "HIGH": return "bg-red-100 text-red-700";
            case "MEDIUM": return "bg-orange-100 text-orange-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">{displayStatus} Tiket</h1>
                    <p className="text-muted-foreground text-sm">Menampilkan semua tiket dengan status: {displayStatus}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Tiket ({tickets.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/30">
                                        Tidak ada tiket ditemukan dalam kategori ini.
                                    </div>
                                )}
                                {tickets.map((t) => (
                                    <Link key={t.id} href={`/tickets/${t.id}`} className="block">
                                        <div className="p-4 border border-border rounded-xl bg-card shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col md:flex-row justify-between gap-4 group">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground">{t.id.slice(-6).toUpperCase()}</Badge>
                                                    <Badge className={getPriorityColor(t.priority)} variant="secondary">{t.priority}</Badge>
                                                    <Badge variant="default" className="bg-slate-800 text-white dark:bg-slate-700">{t.status}</Badge>
                                                </div>
                                                <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{t.title}</h3>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {t.creator.name} ({t.creator.department})
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(t.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
