"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function KBSearch() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const currentQuery = searchParams.get("query") || "";

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        params.delete("category");
        router.replace(`/dashboard/knowledge-base?${params.toString()}`);
    }, 300);

    return (
        <div className="space-y-6">
            {/* Search Input */}
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    defaultValue={currentQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Cari artikel, panduan, atau tutorial..."
                    className="pl-12 py-6 text-base shadow-sm bg-card border-border focus:border-blue-500 rounded-xl text-foreground"
                />
            </div>
        </div>
    );
}
