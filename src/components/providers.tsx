"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SettingsProvider } from "./settings-provider";
import { useEffect } from "react";

export function Providers({ children, settings }: { children: React.ReactNode, settings?: any }) {
    useEffect(() => {
        // Only run on client
        if (typeof window !== "undefined") {
            // Setup Google Translate Init Function
            (window as any).googleTranslateElementInit = function () {
                if ((window as any).google && (window as any).google.translate) {
                    new (window as any).google.translate.TranslateElement(
                        {
                            pageLanguage: 'id',
                            includedLanguages: 'id,en',
                            autoDisplay: false
                        },
                        'google_translate_element_dynamic'
                    );
                }
            };

            // Prevent duplicate injections during dev fast-refresh
            if (!document.getElementById("google_translate_element_dynamic")) {
                const gtDiv = document.createElement("div");
                gtDiv.id = "google_translate_element_dynamic";
                gtDiv.style.display = "none";
                document.body.appendChild(gtDiv);

                const script = document.createElement("script");
                script.id = "google-translate-script";
                script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }
        }
    }, []);
    return (
        <SessionProvider>
            <SettingsProvider settings={settings || {}}>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </NextThemesProvider>
            </SettingsProvider>
        </SessionProvider>
    );
}
