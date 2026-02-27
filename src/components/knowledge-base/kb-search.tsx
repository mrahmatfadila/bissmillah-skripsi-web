"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const ALL_CATEGORIES = [
    { label: "Semua", value: "ALL" },
    { label: "IT Support", value: "IT_SUPPORT" },
    { label: "Security", value: "SECURITY" },
    { label: "Finance", value: "FINANCE" },
    { label: "General", value: "GENERAL" }
];

export function KBSearch() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const currentCategory = searchParams.get("category") || "ALL";
    const currentQuery = searchParams.get("query") || "";

    // Filter categories based on role
    const role = session?.user?.role;
    let CATEGORIES = ALL_CATEGORIES;

    if (role === 'STAFF' || role === 'SUPERVISOR') {
        // STAFF and SUPERVISOR can only see GENERAL
        CATEGORIES = [{ label: "General", value: "GENERAL" }];
    } else if (role === 'FINANCE') {
        CATEGORIES = [{ label: "Finance", value: "FINANCE" }];
    } else if (role === 'SECURITY') {
        CATEGORIES = [{ label: "Security", value: "SECURITY" }];
    }
    // IT_SUPPORT, SUPER_ADMIN, MANAGER see all categories

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        router.replace(`/dashboard/knowledge-base?${params.toString()}`);
    }, 300);

    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams);
        if (category === "ALL") {
            params.delete("category");
        } else {
            params.set("category", category);
        }
        router.replace(`/dashboard/knowledge-base?${params.toString()}`);
    };

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

            {/* Category Tabs */}
            {CATEGORIES.length > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {CATEGORIES.map((cat) => (
                        <Button
                            key={cat.value}
                            variant="ghost"
                            onClick={() => handleCategoryChange(cat.value)}
                            className={cn(
                                "rounded-full px-6 transition-all",
                                (currentCategory === cat.value || (cat.value === "ALL" && !searchParams.get("category")))
                                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md shadow-blue-200 dark:shadow-none"
                                    : "bg-card text-muted-foreground hover:bg-muted border border-border"
                            )}
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
