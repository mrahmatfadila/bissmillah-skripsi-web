"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function DepartmentTicketPage() {
    const params = useParams();
    const dept = (params.dept as string);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Map URL friendly dept to DB values if needed
                // it-support -> IT_SUPPORT
                let dbDept = dept.toUpperCase().replace("-", "_");
                if (dept === 'shop') dbDept = 'SHOP'; // Example mapping

                const res = await fetch(`/api/tickets/search?department=${dbDept}`);
                if (res.ok) {
                    setTickets(await res.json());
                }
            } catch (e) { console.error(e) }
            setLoading(false);
        };
        fetchTickets();
    }, [dept]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 capitalize">Tiket {dept.replace("-", " ")}</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tiket ({tickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <div className="space-y-2">
                            {tickets.length === 0 && <p className="text-muted-foreground">Tidak ada tiket ditemukan.</p>}
                            {tickets.map((t: any) => (
                                <Link key={t.id} href={`/tickets/${t.id}`} className="block">
                                    <div className="p-4 border border-border rounded-lg mb-3 bg-card hover:bg-muted/50 hover:border-blue-300 transition-all cursor-pointer">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-semibold text-foreground">{t.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                                            </div>
                                            <Badge variant="secondary" className={
                                                t.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    t.status === 'CLOSED' ? 'bg-muted text-muted-foreground' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }>
                                                {t.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
