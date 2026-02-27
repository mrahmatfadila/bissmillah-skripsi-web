"use client";

import { Shield, Mail, Globe, Heart } from "lucide-react";
import Link from "next/link";
import { useSystemSettings } from "@/components/settings-provider";

export function Footer() {
    const { settings } = useSystemSettings();
    const currentYear = new Date().getFullYear();
    const appName = settings?.general?.appName || "IT Support";
    const companyName = settings?.general?.companyName || "PT. DEWATA FREIGHTINTERNATIONAL TBK";

    return (
        <footer className="w-full bg-background/80 backdrop-blur-md border-t border-border mt-auto sticky bottom-0 z-40">
            <div className="px-4 md:px-6 py-3">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-xs text-muted-foreground text-center sm:text-left font-medium">
                        &copy; {currentYear} <span className="text-foreground">{companyName}</span>. All rights reserved.
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            Built with <Heart className="w-3 h-3 text-red-500 mx-1 fill-red-500" /> by <span className="font-semibold ml-1">Tim IT</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 border-l border-border pl-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <span className="sr-only">Website</span>
                                <Globe className="h-4 w-4" />
                            </Link>
                            <Link href="mailto:support@email.com" className="text-muted-foreground hover:text-primary transition-colors">
                                <span className="sr-only">Email Support</span>
                                <Mail className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
