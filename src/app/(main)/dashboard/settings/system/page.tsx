"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Settings,
    Save,
    Loader2,
    RefreshCw,
    Globe,
    Ticket,
    Bell,
    Shield,
    Clock,
    Wrench,
    AlertTriangle,
    CheckCircle2,
    RotateCcw,
    Info,
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
    general: {
        appName: string;
        appLogo: string;
        companyName: string;
        supportEmail: string;
        supportPhone: string;
        timezone: string;
        language: string;
        dateFormat: string;
    };
    ticket: {
        autoAssignEnabled: boolean;
        autoCloseEnabled: boolean;
        autoCloseDays: number;
        maxAttachmentSize: number;
        allowedFileTypes: string;
        requireCategory: boolean;
        requirePriority: boolean;
        defaultPriority: string;
        ticketPrefix: string;
    };
    notification: {
        emailEnabled: boolean;
        whatsappEnabled: boolean;
        whatsappApiKey: string;
        whatsappAdminPhone: string;
        notifyOnCreate: boolean;
        notifyOnAssign: boolean;
        notifyOnStatusChange: boolean;
        notifyOnComment: boolean;
        notifyOnClose: boolean;
    };
    security: {
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        requireStrongPassword: boolean;
        passwordMinLength: number;
        twoFactorEnabled: boolean;
        ipWhitelistEnabled: boolean;
        ipWhitelist: string;
    };
    sla: {
        enabled: boolean;
        criticalHours: number;
        highHours: number;
        mediumHours: number;
        lowHours: number;
        warningThreshold: number;
    };
    maintenance: {
        maintenanceMode: boolean;
        maintenanceMessage: string;
        allowAdminAccess: boolean;
        scheduledMaintenance: string;
    };
    updatedAt?: string;
    updatedBy?: string;
}

const TABS = [
    { id: "general", label: "Umum", icon: Globe, color: "text-blue-600" },
    { id: "ticket", label: "Tiket", icon: Ticket, color: "text-green-600" },
    { id: "notification", label: "Notifikasi", icon: Bell, color: "text-orange-600" },
    { id: "security", label: "Keamanan", icon: Shield, color: "text-red-600" },
    { id: "sla", label: "SLA", icon: Clock, color: "text-purple-600" },
    { id: "maintenance", label: "Maintenance", icon: Wrench, color: "text-yellow-600" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SystemSettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>("general");
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);

    useEffect(() => {
        if (session && !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
            router.push("/dashboard");
        }
    }, [session, router]);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/settings/system");
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                setOriginalSettings(JSON.parse(JSON.stringify(data)));
                setHasChanges(false);
            } else {
                toast.error("Gagal memuat pengaturan sistem");
            }
        } catch {
            toast.error("Error memuat pengaturan sistem");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSettings = (section: keyof SystemSettings, key: string, value: unknown) => {
        if (!settings) return;
        setSettings((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                [section]: {
                    ...(prev[section] as Record<string, unknown>),
                    [key]: value,
                },
            };
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!settings) return;
        try {
            setSaving(true);
            const response = await fetch("/api/settings/system", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
                setHasChanges(false);
                toast.success("Pengaturan berhasil disimpan!");
            } else {
                const err = await response.json();
                toast.error(err.error || "Gagal menyimpan pengaturan");
            }
        } catch {
            toast.error("Error menyimpan pengaturan");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Reset semua pengaturan ke nilai default? Tindakan ini tidak dapat dibatalkan.")) return;
        try {
            setSaving(true);
            const response = await fetch("/api/settings/system", { method: "POST" });
            if (response.ok) {
                await fetchSettings();
                toast.success("Pengaturan berhasil direset ke default");
            }
        } catch {
            toast.error("Gagal mereset pengaturan");
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (originalSettings) {
            setSettings(JSON.parse(JSON.stringify(originalSettings)));
            setHasChanges(false);
            toast.info("Perubahan dibatalkan");
        }
    };

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-background/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Memuat pengaturan sistem...</p>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="min-h-screen bg-background/50">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 md:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between max-w-7xl mx-auto gap-4 md:gap-0">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Settings className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg md:text-xl font-bold text-foreground">Pengaturan Sistem</h1>
                            <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                                {settings.updatedAt
                                    ? `Terakhir diubah: ${new Date(settings.updatedAt).toLocaleString("id-ID")} oleh ${settings.updatedBy}`
                                    : "Konfigurasi sistem IT Ticketing Support"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={saving} className="flex-1 md:flex-none">
                            <RefreshCw className="w-4 h-4 mr-0 md:mr-2" />
                            <span className="hidden md:inline">Refresh</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="flex-1 md:flex-none text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:bg-red-900/20">
                            <RotateCcw className="w-4 h-4 mr-0 md:mr-2" />
                            <span className="hidden md:inline">Reset Default</span>
                        </Button>
                        {hasChanges && (
                            <Button variant="outline" size="sm" onClick={handleDiscard} disabled={saving} className="flex-1 md:flex-none">
                                Batalkan
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 flex-1 md:flex-none whitespace-nowrap"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Simpan
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Unsaved changes banner */}
                {hasChanges && (
                    <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Ada perubahan yang belum disimpan.</span>
                        <span className="text-amber-600">Klik &quot;Simpan Perubahan&quot; untuk menerapkan.</span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-56 flex-shrink-0">
                        <div className="bg-card rounded-xl border border-border p-2 flex overflow-x-auto md:flex-col gap-2 md:gap-0 md:space-y-1 sticky top-24 z-10 custom-scrollbar">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-auto md:w-full flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : tab.color}`} />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-6">
                        {/* === GENERAL TAB === */}
                        {activeTab === "general" && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                            Informasi Aplikasi
                                        </CardTitle>
                                        <CardDescription>Pengaturan dasar aplikasi dan identitas perusahaan</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="appName">Nama Aplikasi</Label>
                                                <Input
                                                    id="appName"
                                                    value={settings.general.appName}
                                                    onChange={(e) => updateSettings("general", "appName", e.target.value)}
                                                    placeholder="IT Ticketing Support"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="companyName">Nama Perusahaan</Label>
                                                <Input
                                                    id="companyName"
                                                    value={settings.general.companyName}
                                                    onChange={(e) => updateSettings("general", "companyName", e.target.value)}
                                                    placeholder="PT Plaza Bali"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="supportEmail">Email Support</Label>
                                                <Input
                                                    id="supportEmail"
                                                    type="email"
                                                    value={settings.general.supportEmail}
                                                    onChange={(e) => updateSettings("general", "supportEmail", e.target.value)}
                                                    placeholder="support@example.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="supportPhone">Telepon Support</Label>
                                                <Input
                                                    id="supportPhone"
                                                    value={settings.general.supportPhone}
                                                    onChange={(e) => updateSettings("general", "supportPhone", e.target.value)}
                                                    placeholder="08xxxxxxxx"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                            Lokalisasi & Format
                                        </CardTitle>
                                        <CardDescription>Pengaturan bahasa, zona waktu, dan format tampilan</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Zona Waktu</Label>
                                                <Select
                                                    value={settings.general.timezone}
                                                    onValueChange={(v) => updateSettings("general", "timezone", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Asia/Jakarta">WIB - Jakarta (UTC+7)</SelectItem>
                                                        <SelectItem value="Asia/Makassar">WITA - Bali/Makassar (UTC+8)</SelectItem>
                                                        <SelectItem value="Asia/Jayapura">WIT - Jayapura (UTC+9)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Bahasa</Label>
                                                <Select
                                                    value={settings.general.language}
                                                    onValueChange={(v) => updateSettings("general", "language", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="id">Indonesia</SelectItem>
                                                        <SelectItem value="en">English</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Format Tanggal</Label>
                                                <Select
                                                    value={settings.general.dateFormat}
                                                    onValueChange={(v) => updateSettings("general", "dateFormat", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* === TICKET TAB === */}
                        {activeTab === "ticket" && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Ticket className="w-5 h-5 text-green-600" />
                                            Pengaturan Tiket
                                        </CardTitle>
                                        <CardDescription>Konfigurasi perilaku dan aturan tiket</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ticketPrefix">Prefiks Nomor Tiket</Label>
                                                <Input
                                                    id="ticketPrefix"
                                                    value={settings.ticket.ticketPrefix}
                                                    onChange={(e) => updateSettings("ticket", "ticketPrefix", e.target.value)}
                                                    placeholder="TKT"
                                                    maxLength={5}
                                                />
                                                <p className="text-xs text-muted-foreground">Contoh: TKT-20240101-001</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Prioritas Default</Label>
                                                <Select
                                                    value={settings.ticket.defaultPriority}
                                                    onValueChange={(v) => updateSettings("ticket", "defaultPriority", v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LOW">Rendah</SelectItem>
                                                        <SelectItem value="MEDIUM">Sedang</SelectItem>
                                                        <SelectItem value="HIGH">Tinggi</SelectItem>
                                                        <SelectItem value="CRITICAL">Kritis</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">Wajib Pilih Kategori</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">User harus memilih kategori saat membuat tiket</p>
                                                </div>
                                                <Switch
                                                    checked={settings.ticket.requireCategory}
                                                    onCheckedChange={(v) => updateSettings("ticket", "requireCategory", v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">Wajib Pilih Prioritas</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">User harus memilih prioritas saat membuat tiket</p>
                                                </div>
                                                <Switch
                                                    checked={settings.ticket.requirePriority}
                                                    onCheckedChange={(v) => updateSettings("ticket", "requirePriority", v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">Auto-Assign Tiket</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Otomatis tugaskan tiket ke IT Support yang tersedia</p>
                                                </div>
                                                <Switch
                                                    checked={settings.ticket.autoAssignEnabled}
                                                    onCheckedChange={(v) => updateSettings("ticket", "autoAssignEnabled", v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">Auto-Close Tiket</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Otomatis tutup tiket yang sudah Resolved setelah beberapa hari</p>
                                                </div>
                                                <Switch
                                                    checked={settings.ticket.autoCloseEnabled}
                                                    onCheckedChange={(v) => updateSettings("ticket", "autoCloseEnabled", v)}
                                                />
                                            </div>
                                            {settings.ticket.autoCloseEnabled && (
                                                <div className="ml-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="autoCloseDays">Tutup setelah (hari)</Label>
                                                        <Input
                                                            id="autoCloseDays"
                                                            type="number"
                                                            min={1}
                                                            max={30}
                                                            value={settings.ticket.autoCloseDays}
                                                            onChange={(e) => updateSettings("ticket", "autoCloseDays", Number(e.target.value))}
                                                            className="w-32"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="maxAttachmentSize">Ukuran Lampiran Maks (MB)</Label>
                                                <Input
                                                    id="maxAttachmentSize"
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    value={settings.ticket.maxAttachmentSize}
                                                    onChange={(e) => updateSettings("ticket", "maxAttachmentSize", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="allowedFileTypes">Tipe File Diizinkan</Label>
                                                <Input
                                                    id="allowedFileTypes"
                                                    value={settings.ticket.allowedFileTypes}
                                                    onChange={(e) => updateSettings("ticket", "allowedFileTypes", e.target.value)}
                                                    placeholder="jpg,jpeg,png,pdf,doc"
                                                />
                                                <p className="text-xs text-muted-foreground">Pisahkan dengan koma</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* === NOTIFICATION TAB === */}
                        {activeTab === "notification" && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Bell className="w-5 h-5 text-orange-600" />
                                            Konfigurasi WhatsApp
                                        </CardTitle>
                                        <CardDescription>Pengaturan notifikasi WhatsApp via Fonnte</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div>
                                                <Label className="text-sm font-medium text-green-800 dark:text-green-400">Aktifkan Notifikasi WhatsApp</Label>
                                                <p className="text-xs text-green-600 mt-0.5">Kirim notifikasi tiket via WhatsApp</p>
                                            </div>
                                            <Switch
                                                checked={settings.notification.whatsappEnabled}
                                                onCheckedChange={(v) => updateSettings("notification", "whatsappEnabled", v)}
                                            />
                                        </div>
                                        {settings.notification.whatsappEnabled && (
                                            <div className="space-y-4 p-4 bg-muted rounded-lg border">
                                                <div className="space-y-2">
                                                    <Label htmlFor="whatsappApiKey">API Key Fonnte</Label>
                                                    <Input
                                                        id="whatsappApiKey"
                                                        type="password"
                                                        value={settings.notification.whatsappApiKey}
                                                        onChange={(e) => updateSettings("notification", "whatsappApiKey", e.target.value)}
                                                        placeholder="Masukkan API Key dari fonnte.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="whatsappAdminPhone">Nomor Admin WA</Label>
                                                    {/* Tag-based phone number manager */}
                                                    <div className="border border-input rounded-md p-3 bg-background space-y-3">
                                                        {/* Existing phone tags */}
                                                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                                                            {settings.notification.whatsappAdminPhone
                                                                ? settings.notification.whatsappAdminPhone
                                                                    .split(',')
                                                                    .map((p: string) => p.trim())
                                                                    .filter(Boolean)
                                                                    .map((phone: string, idx: number) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700 rounded-full px-3 py-1 text-sm font-medium"
                                                                        >
                                                                            📱 {phone}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const phones = settings.notification.whatsappAdminPhone
                                                                                        .split(',').map((p: string) => p.trim()).filter(Boolean);
                                                                                    phones.splice(idx, 1);
                                                                                    updateSettings("notification", "whatsappAdminPhone", phones.join(','));
                                                                                }}
                                                                                className="text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-0.5 leading-none text-base"
                                                                                title="Hapus nomor ini"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))
                                                                : <span className="text-sm text-muted-foreground italic">Belum ada nomor admin</span>
                                                            }
                                                        </div>

                                                        {/* Add new number input */}
                                                        <div className="flex gap-2">
                                                            <Input
                                                                id="newPhoneInput"
                                                                placeholder="Tambah nomor, contoh: 08123456789"
                                                                className="flex-1 h-8 text-sm"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const input = e.currentTarget;
                                                                        const newPhone = input.value.trim().replace(/\s+/g, '');
                                                                        if (!newPhone) return;
                                                                        const existing = settings.notification.whatsappAdminPhone
                                                                            ? settings.notification.whatsappAdminPhone.split(',').map((p: string) => p.trim()).filter(Boolean)
                                                                            : [];
                                                                        if (!existing.includes(newPhone)) {
                                                                            updateSettings("notification", "whatsappAdminPhone", [...existing, newPhone].join(','));
                                                                        }
                                                                        input.value = '';
                                                                    }
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                                                                onClick={() => {
                                                                    const input = document.getElementById('newPhoneInput') as HTMLInputElement;
                                                                    const newPhone = input?.value.trim().replace(/\s+/g, '');
                                                                    if (!newPhone) return;
                                                                    const existing = settings.notification.whatsappAdminPhone
                                                                        ? settings.notification.whatsappAdminPhone.split(',').map((p: string) => p.trim()).filter(Boolean)
                                                                        : [];
                                                                    if (!existing.includes(newPhone)) {
                                                                        updateSettings("notification", "whatsappAdminPhone", [...existing, newPhone].join(','));
                                                                    }
                                                                    if (input) input.value = '';
                                                                }}
                                                            >
                                                                + Tambah
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Ketik nomor lalu tekan <kbd className="bg-muted px-1 rounded text-[10px]">Enter</kbd> atau klik <strong>+ Tambah</strong>. Klik <strong>×</strong> untuk hapus.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div>
                                                <Label className="text-sm font-medium text-blue-800 dark:text-blue-400">Aktifkan Notifikasi Email</Label>
                                                <p className="text-xs text-blue-600 mt-0.5">Kirim notifikasi tiket via Email (SMTP)</p>
                                            </div>
                                            <Switch
                                                checked={settings.notification.emailEnabled}
                                                onCheckedChange={(v) => updateSettings("notification", "emailEnabled", v)}
                                            />
                                        </div>
                                        {settings.notification.emailEnabled && (
                                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                                <Info className="w-4 h-4 flex-shrink-0" />
                                                Konfigurasi SMTP harus diatur di file .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Pemicu Notifikasi</CardTitle>
                                        <CardDescription>Pilih event yang akan memicu pengiriman notifikasi</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {[
                                            { key: "notifyOnCreate", label: "Tiket Baru Dibuat", desc: "Notifikasi saat ada tiket baru masuk" },
                                            { key: "notifyOnAssign", label: "Tiket Ditugaskan", desc: "Notifikasi saat tiket ditugaskan ke IT Support" },
                                            { key: "notifyOnStatusChange", label: "Status Tiket Berubah", desc: "Notifikasi saat status tiket diperbarui" },
                                            { key: "notifyOnComment", label: "Komentar Baru", desc: "Notifikasi saat ada komentar baru pada tiket" },
                                            { key: "notifyOnClose", label: "Tiket Ditutup", desc: "Notifikasi saat tiket diselesaikan/ditutup" },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between py-2">
                                                <div>
                                                    <Label className="text-sm font-medium">{item.label}</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                                </div>
                                                <Switch
                                                    checked={settings.notification[item.key as keyof typeof settings.notification] as boolean}
                                                    onCheckedChange={(v) => updateSettings("notification", item.key, v)}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* === SECURITY TAB === */}
                        {activeTab === "security" && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Shield className="w-5 h-5 text-red-600" />
                                            Keamanan Sesi & Login
                                        </CardTitle>
                                        <CardDescription>Pengaturan keamanan akses dan autentikasi pengguna</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="sessionTimeout">Timeout Sesi (menit)</Label>
                                                <Input
                                                    id="sessionTimeout"
                                                    type="number"
                                                    min={15}
                                                    max={1440}
                                                    value={settings.security.sessionTimeout}
                                                    onChange={(e) => updateSettings("security", "sessionTimeout", Number(e.target.value))}
                                                />
                                                <p className="text-xs text-muted-foreground">{Math.floor(settings.security.sessionTimeout / 60)} jam {settings.security.sessionTimeout % 60} menit</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="maxLoginAttempts">Maks Percobaan Login</Label>
                                                <Input
                                                    id="maxLoginAttempts"
                                                    type="number"
                                                    min={3}
                                                    max={10}
                                                    value={settings.security.maxLoginAttempts}
                                                    onChange={(e) => updateSettings("security", "maxLoginAttempts", Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lockoutDuration">Durasi Lockout (menit)</Label>
                                                <Input
                                                    id="lockoutDuration"
                                                    type="number"
                                                    min={5}
                                                    max={60}
                                                    value={settings.security.lockoutDuration}
                                                    onChange={(e) => updateSettings("security", "lockoutDuration", Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">Wajib Password Kuat</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Min. huruf besar, angka, dan simbol</p>
                                                </div>
                                                <Switch
                                                    checked={settings.security.requireStrongPassword}
                                                    onCheckedChange={(v) => updateSettings("security", "requireStrongPassword", v)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="passwordMinLength">Panjang Password Minimum</Label>
                                                <Input
                                                    id="passwordMinLength"
                                                    type="number"
                                                    min={6}
                                                    max={20}
                                                    value={settings.security.passwordMinLength}
                                                    onChange={(e) => updateSettings("security", "passwordMinLength", Number(e.target.value))}
                                                    className="w-32"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium">IP Whitelist</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Batasi akses hanya dari IP tertentu</p>
                                                </div>
                                                <Switch
                                                    checked={settings.security.ipWhitelistEnabled}
                                                    onCheckedChange={(v) => updateSettings("security", "ipWhitelistEnabled", v)}
                                                />
                                            </div>
                                            {settings.security.ipWhitelistEnabled && (
                                                <div className="ml-4 pl-4 border-l-2 border-red-200 dark:border-red-800 space-y-2">
                                                    <Label htmlFor="ipWhitelist">Daftar IP yang Diizinkan</Label>
                                                    <Textarea
                                                        id="ipWhitelist"
                                                        value={settings.security.ipWhitelist}
                                                        onChange={(e) => updateSettings("security", "ipWhitelist", e.target.value)}
                                                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                                                        rows={4}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Satu IP per baris, mendukung CIDR notation</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <div>
                                                <Label className="text-sm font-medium text-amber-800 dark:text-amber-400">Two-Factor Authentication (2FA)</Label>
                                                <p className="text-xs text-amber-600 mt-0.5">Keamanan tambahan untuk seluruh pengguna</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={settings.security.twoFactorEnabled}
                                                    onCheckedChange={(v) => updateSettings("security", "twoFactorEnabled", v)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* === SLA TAB === */}
                        {activeTab === "sla" && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Clock className="w-5 h-5 text-purple-600" />
                                            Service Level Agreement (SLA)
                                        </CardTitle>
                                        <CardDescription>Tentukan target waktu penyelesaian tiket berdasarkan prioritas</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">Aktifkan SLA</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Monitor dan tampilkan progress SLA pada tiket</p>
                                            </div>
                                            <Switch
                                                checked={settings.sla.enabled}
                                                onCheckedChange={(v) => updateSettings("sla", "enabled", v)}
                                            />
                                        </div>

                                        {settings.sla.enabled && (
                                            <>
                                                <Separator />
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-semibold text-foreground/80">Target Waktu Penyelesaian</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {[
                                                            { key: "criticalHours", label: "🔴 Kritis", color: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20", textColor: "text-red-700 dark:text-red-400" },
                                                            { key: "highHours", label: "🟠 Tinggi", color: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20", textColor: "text-orange-700 dark:text-orange-400" },
                                                            { key: "mediumHours", label: "🟡 Sedang", color: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20", textColor: "text-yellow-700 dark:text-yellow-400" },
                                                            { key: "lowHours", label: "🟢 Rendah", color: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20", textColor: "text-green-700 dark:text-green-400" },
                                                        ].map((item) => (
                                                            <div key={item.key} className={`p-4 border rounded-lg ${item.color}`}>
                                                                <Label className={`text-sm font-medium ${item.textColor}`}>{item.label}</Label>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        max={720}
                                                                        value={settings.sla[item.key as keyof typeof settings.sla] as number}
                                                                        onChange={(e) => updateSettings("sla", item.key, Number(e.target.value))}
                                                                        className="w-24 bg-card"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">jam</span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    ≈ {settings.sla[item.key as keyof typeof settings.sla] && Number(settings.sla[item.key as keyof typeof settings.sla]) >= 24
                                                                        ? `${Math.floor(Number(settings.sla[item.key as keyof typeof settings.sla]) / 24)} hari ${Number(settings.sla[item.key as keyof typeof settings.sla]) % 24} jam`
                                                                        : `${settings.sla[item.key as keyof typeof settings.sla]} jam`}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="warningThreshold">Threshold Warning SLA (%)</Label>
                                                        <div className="flex items-center gap-3">
                                                            <Input
                                                                id="warningThreshold"
                                                                type="number"
                                                                min={50}
                                                                max={95}
                                                                value={settings.sla.warningThreshold}
                                                                onChange={(e) => updateSettings("sla", "warningThreshold", Number(e.target.value))}
                                                                className="w-24"
                                                            />
                                                            <span className="text-sm text-muted-foreground">%</span>
                                                            <p className="text-xs text-muted-foreground">Tampilkan peringatan saat SLA tersisa {100 - settings.sla.warningThreshold}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* === MAINTENANCE TAB === */}
                        {activeTab === "maintenance" && (
                            <>
                                <Card className={settings.maintenance.maintenanceMode ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/30" : ""}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Wrench className="w-5 h-5 text-yellow-600" />
                                            Mode Maintenance
                                            {settings.maintenance.maintenanceMode && (
                                                <Badge className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs ml-2">
                                                    AKTIF
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>Kontrol akses sistem saat maintenance berlangsung</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {settings.maintenance.maintenanceMode && (
                                            <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-700 rounded-lg">
                                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-red-800 dark:text-red-400">⚠ Mode Maintenance Sedang Aktif</p>
                                                    <p className="text-xs text-red-600 mt-0.5">Pengguna biasa tidak dapat mengakses sistem saat ini</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                            <div>
                                                <Label className="text-sm font-semibold">Aktifkan Mode Maintenance</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Nonaktifkan akses sistem untuk pengguna umum</p>
                                            </div>
                                            <Switch
                                                checked={settings.maintenance.maintenanceMode}
                                                onCheckedChange={(v) => updateSettings("maintenance", "maintenanceMode", v)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                            <div>
                                                <Label className="text-sm font-medium">Izinkan Akses Admin</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Super Admin tetap bisa login saat maintenance</p>
                                            </div>
                                            <Switch
                                                checked={settings.maintenance.allowAdminAccess}
                                                onCheckedChange={(v) => updateSettings("maintenance", "allowAdminAccess", v)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maintenanceMessage">Pesan Maintenance</Label>
                                            <Textarea
                                                id="maintenanceMessage"
                                                value={settings.maintenance.maintenanceMessage}
                                                onChange={(e) => updateSettings("maintenance", "maintenanceMessage", e.target.value)}
                                                placeholder="Sistem sedang dalam pemeliharaan..."
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">Pesan ini akan ditampilkan ke pengguna saat sistem maintenance</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="scheduledMaintenance">Jadwal Maintenance Berikutnya</Label>
                                            <Input
                                                id="scheduledMaintenance"
                                                type="datetime-local"
                                                value={settings.maintenance.scheduledMaintenance}
                                                onChange={(e) => updateSettings("maintenance", "scheduledMaintenance", e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">Informasi opsional untuk ditampilkan ke pengguna</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            Informasi Sistem
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: "Framework", value: "Next.js 14" },
                                                { label: "Database", value: "PostgreSQL" },
                                                { label: "ORM", value: "Prisma" },
                                                { label: "Auth", value: "NextAuth.js" },
                                                { label: "Node.js", value: process.version || "v18+" },
                                                { label: "Environment", value: process.env.NODE_ENV || "development" },
                                            ].map((item) => (
                                                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50">
                                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                                    <Badge variant="outline" className="text-xs font-mono">{item.value}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Save Bar (floating) */}
                {hasChanges && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <div className="bg-card border border-border shadow-xl rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-sm font-medium text-foreground/80">Ada perubahan yang belum disimpan</span>
                            <Button size="sm" variant="outline" onClick={handleDiscard} disabled={saving}>
                                Batalkan
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                                Simpan
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
