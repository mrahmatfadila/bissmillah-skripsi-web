"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export const changeLanguageGlobal = (lang: "id" | "en") => {
    const cookieValue = lang === "en" ? "/id/en" : "/id/id";

    // 1. Force Google Translate to change immediately
    const translateSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (translateSelect) {
        translateSelect.value = lang;
        translateSelect.dispatchEvent(new Event("change"));
    }

    // 2. Clear potential old cookies
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;

    // 3. Set cookie for the path and domain
    document.cookie = `googtrans=${cookieValue}; path=/`;
    if (window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=${cookieValue}; domain=${window.location.hostname}; path=/`;
    }

    // Let Google Translate run, then reload cleanly
    setTimeout(() => {
        window.location.reload();
    }, 800);
};

export function LanguageSwitcher() {
    const [currentLang, setCurrentLang] = useState<"id" | "en">("id");

    useEffect(() => {
        // Read the current language from the googtrans cookie
        const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
        if (match && match[1]) {
            const val = decodeURIComponent(match[1]);
            if (val.includes("/en")) {
                setCurrentLang("en");
            } else {
                setCurrentLang("id");
            }
        }
    }, []);

    const setLanguage = (lang: "id" | "en") => {
        if (lang === currentLang) return;
        setCurrentLang(lang);
        changeLanguageGlobal(lang);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
                    <Globe className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("id")} className={currentLang === "id" ? "bg-muted font-medium" : ""}>
                    <span className="mr-2">🇮🇩</span> Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className={currentLang === "en" ? "bg-muted font-medium" : ""}>
                    <span className="mr-2">🇺🇸</span> English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
