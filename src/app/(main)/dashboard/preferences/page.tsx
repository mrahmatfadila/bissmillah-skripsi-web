"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Bell, Globe, Moon, Monitor, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useSystemSettings } from "@/components/settings-provider";
import { changeLanguageGlobal } from "@/components/language-switcher";

export default function PreferencesPage() {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();
    const { settings } = useSystemSettings();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Baca language saat ini dari cookie googtrans
        const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
        if (match && match[1]) {
            const val = decodeURIComponent(match[1]);
            if (val.includes("/en")) {
                setPreferences(prev => ({ ...prev, language: "en" }));
            } else {
                setPreferences(prev => ({ ...prev, language: "id" }));
            }
        }
    }, []);

    // Default preferences state (Mocked locally for demo, ideally fetched from a user-preferences DB table)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: false,
        ticketUpdates: true,
        marketingEmails: false,
        language: settings?.general?.language || "id",
    });

    const handleToggle = (key: keyof Omit<typeof preferences, "language">) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Mock network save
            await new Promise((resolve) => setTimeout(resolve, 800));

            const targetLang = preferences.language === "en" ? "en" : "id";

            toast.success("Preferensi berhasil disimpan dan bahasa diperbarui!");
            setLoading(false);

            // Gunakan utilitas global yang 100% sama dengan Navbar
            changeLanguageGlobal(targetLang as "id" | "en");
            
        } catch (error) {
            toast.error("Gagal menyimpan preferensi");
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Pengaturan Akun & Preferensi</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Sesuaikan pengalaman menggunakan aplikasi sesuai keinginan Anda.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" />
                            Tampilan & Tema
                        </CardTitle>
                        <CardDescription>Pilih tema visual aplikasi (Mode Terang/Gelap).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="button"
                                variant={mounted && theme === "light" ? "default" : "outline"}
                                className="flex-1 justify-center gap-2"
                                onClick={() => setTheme("light")}
                            >
                                <Sun className="w-4 h-4" /> Terang
                            </Button>
                            <Button
                                type="button"
                                variant={mounted && theme === "dark" ? "default" : "outline"}
                                className="flex-1 justify-center gap-2"
                                onClick={() => setTheme("dark")}
                            >
                                <Moon className="w-4 h-4" /> Gelap
                            </Button>
                            <Button
                                type="button"
                                variant={mounted && theme === "system" ? "default" : "outline"}
                                className="flex-1 justify-center gap-2"
                                onClick={() => setTheme("system")}
                            >
                                <Monitor className="w-4 h-4" /> Sistem Default
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Bahasa & Regional
                        </CardTitle>
                        <CardDescription>Pilih bahasa default untuk aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Bahasa</Label>
                            <Select
                                value={preferences.language}
                                onValueChange={(val) => setPreferences(prev => ({ ...prev, language: val }))}
                            >
                                <SelectTrigger className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Pilih Bahasa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="id">Indonesia (ID)</SelectItem>
                                    <SelectItem value="en">English (EN)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                                *Catatan: Fitur Auto-Translate dari sistem juga dapat menerjemahkan konten dinamis.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            Notifikasi
                        </CardTitle>
                        <CardDescription>Pilih kapan dan bagaimana Anda ingin dihubungi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-background/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Notifikasi Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    Terima pemberitahuan melalui email yang terdaftar.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.emailNotifications}
                                onCheckedChange={() => handleToggle("emailNotifications")}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-background/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Pemberitahuan Status Tiket</Label>
                                <p className="text-sm text-muted-foreground">
                                    Kirim notifikasi setiap kali tiket Anda diubah atau dibalas.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.ticketUpdates}
                                onCheckedChange={() => handleToggle("ticketUpdates")}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-background/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Notifikasi Push Timbul (Live)</Label>
                                <p className="text-sm text-muted-foreground">
                                    Tampilkan popup pesan selagi aplikasi terbuka.
                                </p>
                            </div>
                            <Switch
                                checked={preferences.pushNotifications}
                                onCheckedChange={() => handleToggle("pushNotifications")}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 pb-10">
                    <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                        {loading ? "Menyimpan..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Preferensi
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
