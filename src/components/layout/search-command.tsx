"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Ticket, LayoutDashboard, Loader2, Calendar, Settings, User } from "lucide-react";
import { useDebounce } from "use-debounce";

interface SearchResult {
    tickets: Array<{
        id: string;
        ticketNumber: string;
        title: string;
        status: string;
    }>;
    articles: Array<{
        id: string;
        title: string;
        category: string;
    }>;
}

export function SearchCommand({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [debouncedQuery] = useDebounce(query, 500);
    const [results, setResults] = React.useState<SearchResult | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [onOpenChange]);

    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults(null);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [debouncedQuery]);

    const handleSelect = (url: string) => {
        onOpenChange(false);
        router.push(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-2xl bg-background border-border shadow-2xl overflow-hidden">
                <DialogTitle className="sr-only">Search</DialogTitle>
                <div className="flex items-center px-4 py-3 border-b border-border bg-muted/20">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
                        placeholder="Cari tiket, artikel, atau halaman..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-2">
                        <span className="text-xs">ESC</span>
                    </kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {!query && (
                        <div className="p-2">
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 py-2 uppercase tracking-wider">Halaman Cepat</h3>
                            <div className="space-y-1">
                                <NavItem icon={<LayoutDashboard />} label="Dashboard" onClick={() => handleSelect("/dashboard")} />
                                <NavItem icon={<Ticket />} label="Tiket Saya" onClick={() => handleSelect("/tickets/mine")} />
                                <NavItem icon={<Calendar />} label="Buat Tiket Baru" onClick={() => handleSelect("/tickets/create")} />
                                <NavItem icon={<User />} label="Profil Saya" onClick={() => handleSelect("/dashboard/profile")} />
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-4">
                            {results.tickets.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">Tiket</h3>
                                    {results.tickets.map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelect(`/tickets/${t.id}`)}
                                            className="group flex items-center justify-between px-4 py-2 hover:bg-muted/50 cursor-pointer rounded-lg mx-2 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Ticket className="w-4 h-4 text-blue-500" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-medium truncate">{t.title}</span>
                                                    <span className="text-xs text-muted-foreground">{t.ticketNumber} • {t.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.articles.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">Knowledge Base</h3>
                                    {results.articles.map((a) => (
                                        <div
                                            key={a.id}
                                            onClick={() => handleSelect(`/dashboard/knowledge-base/${a.id}`)}
                                            className="group flex items-center gap-3 px-4 py-2 hover:bg-muted/50 cursor-pointer rounded-lg mx-2 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 text-emerald-500" />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{a.title}</span>
                                                <span className="text-xs text-muted-foreground">{a.category}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.tickets.length === 0 && results.articles.length === 0 && query.length >= 2 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    Tidak ada hasil untuk "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NavItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-lg text-sm font-medium transition-colors"
        >
            <span className="text-muted-foreground group-hover:text-foreground">{icon}</span>
            {label}
        </div>
    );
}
