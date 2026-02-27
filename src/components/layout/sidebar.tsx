"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard,
    PieChart,
    Users,
    FileText,
    Settings,
    User,
    CheckSquare,
    MessageSquare,
    AlertCircle,
    Shield,
    CreditCard,
    ShoppingBag,
    Headphones,
    LogOut,
    ChevronLeft,
    Database,
    Code,
    BookOpen,
    BarChart3,
    Camera,
    Clock,
    ArrowLeftRight,
    CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role;
    const { hasPermission, loading: permissionsLoading } = usePermissions();
    const [ticketCounts, setTicketCounts] = useState({
        all: 0,
        unassigned: 0,
        mine: 0,
        assigned: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/tickets/stats');
                if (res.ok) {
                    const data = await res.json();
                    setTicketCounts(data);
                }
            } catch (e) {
                console.error("Failed to fetch ticket counts", e);
            }
        };

        fetchCounts();

        // Poll every minute
        const interval = setInterval(fetchCounts, 60000);

        // Listen for refresh events
        const handleRefresh = () => fetchCounts();
        window.addEventListener('ticket-stats-refresh', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('ticket-stats-refresh', handleRefresh);
        };
    }, [pathname]);

    const NavLink = ({ href, icon: Icon, label, badge, color }: any) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                className={cn(
                    "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    isActive
                        ? "text-sidebar-primary bg-sidebar-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                    <span>{label}</span>
                </div>
                {badge && (
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", color || "bg-muted text-muted-foreground")}>
                        {badge}
                    </span>
                )}
            </Link>
        );
    };

    const divDot = (color: string) => {
        return function Dot({ className }: { className?: string }) {
            return (
                <div className={cn("w-2 h-2 rounded-full mx-1.5", className)} style={{ backgroundColor: color }}></div>
            );
        };
    };

    if (permissionsLoading) {
        return (
            <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground w-full">
                <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground w-full transition-colors duration-300">
            <div className="px-6 py-6 flex items-center gap-3">
                <Image
                    src="/logo/login-logo.png"
                    alt="Company Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                />
                <div className="text-xs text-muted-foreground font-medium px-2 py-1 bg-sidebar-accent/50 rounded truncate max-w-[120px]" title={role || "GUEST"}>
                    {role ? role.replace(/_/g, " ").replace("SHOP DEWATA", "DAW").replace("SHOP SAM", "SAM").substring(0, 15) : "GUEST"}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-6">
                {/* Dashboard */}
                {hasPermission("dashboard") && (
                    <div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            {hasPermission("activity_log") && <NavLink href="/dashboard/activity" icon={FileText} label="Log Aktivitas" />}
                        </div>
                    </div>
                )}

                {/* Tickets */}
                {hasPermission("my_tickets") && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tiket</h3>
                        <div className="space-y-1">
                            {hasPermission("unassigned_tickets") && (
                                <NavLink href="/tickets/unassigned" icon={AlertCircle} label="Belum Ditugaskan" badge={ticketCounts.unassigned > 0 ? ticketCounts.unassigned : undefined} color="bg-destructive/10 text-destructive" />
                            )}
                            <NavLink href="/tickets/mine" icon={User} label="Tiket Saya" badge={ticketCounts.mine > 0 ? ticketCounts.mine : undefined} />
                            {hasPermission("assigned_tickets") && (
                                <NavLink href="/tickets/assigned" icon={CheckSquare} label="Tugas Saya" />
                            )}
                            {hasPermission("spam_tickets") && (
                                <NavLink href="/tickets/spam" icon={MessageSquare} label="Spam" />
                            )}
                        </div>
                    </div>
                )}

                {/* Status Filters */}
                {hasPermission("status_filters") && (
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h3>
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/status/open" icon={divDot("#3b82f6")} label="Terbuka" />
                            <NavLink href="/dashboard/status/in_progress" icon={divDot("#f59e0b")} label="Diproses" />
                            <NavLink href="/dashboard/status/pending" icon={divDot("#8b5cf6")} label="Tertunda" />
                            <NavLink href="/dashboard/status/resolved" icon={divDot("#10b981")} label="Selesai" />
                            <NavLink href="/dashboard/status/closed" icon={divDot("#6b7280")} label="Ditutup" />
                            <NavLink href="/dashboard/status/cancelled" icon={divDot("#ef4444")} label="Dibatalkan" />
                        </div>
                    </div>
                )}

                {/* Departments */}
                {hasPermission("departments") && (
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departemen</h3>
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/dept/unspecified" icon={divDot("gray")} label="Umum" />
                            <NavLink href="/dashboard/dept/it-support" icon={Headphones} label="IT Support MIS" />
                            <NavLink href="/dashboard/dept/shop" icon={ShoppingBag} label="Toko & Retail" />
                            <NavLink href="/dashboard/dept/finance" icon={CreditCard} label="Keuangan" />
                            <NavLink href="/dashboard/dept/security" icon={Shield} label="Keamanan" />
                        </div>
                    </div>
                )}

                {/* Knowledge Base */}
                {hasPermission("knowledge_base") && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sumber Daya</h3>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/knowledge-base" icon={BookOpen} label="Knowledge Base" />
                        </div>
                    </div>
                )}

                {/* Jadwal Shift - Visible to IT Support & Admins */}
                {(role === 'IT_SUPPORT' || role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'SUPERVISOR') && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Jadwal Kerja</h3>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/settings/schedule/view" icon={CalendarDays} label="Kalender Shift" />
                            <NavLink href="/dashboard/settings/schedule/swap" icon={ArrowLeftRight} label="Tukar Shift" />
                        </div>
                    </div>
                )}

                {/* Security - CCTV */}
                {hasPermission("cctv_issues") && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Keamanan</h3>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/security/cctv" icon={Camera} label="Masalah CCTV" />
                        </div>
                    </div>
                )}

                {/* Finance - EDC */}
                {hasPermission("edc_issues") && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Keuangan</h3>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/finance/edc" icon={CreditCard} label="Masalah EDC" />
                        </div>
                    </div>
                )}

                {/* Analytics */}
                {(hasPermission("reports") || hasPermission("data_quality")) && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analitik</h3>
                        <div className="space-y-1">
                            {hasPermission("reports") && <NavLink href="/dashboard/analytics" icon={BarChart3} label="Laporan Analitik" />}
                            {hasPermission("data_quality") && <NavLink href="/dashboard/data-quality" icon={Database} label="Kualitas Data" />}
                        </div>
                    </div>
                )}

                {/* Admin */}
                {(hasPermission("ahp_config") || hasPermission("user_management") || hasPermission("role_management") || hasPermission("system_settings")) && (
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2 mt-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h3>
                        </div>
                        <div className="space-y-1">
                            {hasPermission("ahp_config") && <NavLink href="/dashboard/settings/ahp" icon={Settings} label="Konfigurasi AHP" />}
                            {hasPermission("user_management") && <NavLink href="/dashboard/settings/users" icon={Users} label="Manajemen User" />}
                            {hasPermission("role_management") && <NavLink href="/dashboard/settings/roles" icon={Shield} label="Peran & Izin" />}
                            {hasPermission("system_settings") && (
                                <>
                                    <NavLink href="/dashboard/settings/system" icon={Settings} label="Pengaturan Sistem" />
                                    <NavLink href="/dashboard/settings/schedule" icon={Clock} label="Upload Jadwal PDF" />
                                    <NavLink href="/dashboard/settings/schedule/view" icon={CalendarDays} label="Kalender Shift" />
                                    <NavLink href="/dashboard/settings/schedule/swap" icon={ArrowLeftRight} label="Tukar Shift" />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Developer Tools */}
                {hasPermission("dev_tools") && (
                    <div>
                        <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg flex items-center gap-3 font-medium text-sm mb-1">
                            <Code className="w-5 h-5" /> Tools Pengembang
                        </div>
                        <div className="space-y-1 mt-1">
                            <NavLink href="/dev/logs" icon={FileText} label="System Logs" />
                            <NavLink href="/dev/api" icon={Database} label="Dokumen API" />
                            <NavLink href="/dev/monitoring" icon={BarChart3} label="Monitoring" />
                            <NavLink href="/tickets/all" icon={MessageSquare} label="Lihat Semua Tiket" badge={ticketCounts.all > 0 ? ticketCounts.all : undefined} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                )}
                {/* User Settings */}
                {hasPermission("profile_settings") && (
                    <div>
                        <div className="flex items-center justify-between px-3 mb-2 mt-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akun</h3>
                        </div>
                        <div className="space-y-1">
                            <NavLink href="/dashboard/profile" icon={User} label="Pengaturan Profil" />
                            <NavLink href="/dashboard/preferences" icon={Settings} label="Preferensi Akun" />
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile & Sign Out */}
            <div className="p-4 border-t border-sidebar-border">
                <div className="mb-3 px-3">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">{session?.user?.name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email || role}</p>
                </div>
                <Button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                </Button>
            </div>
        </div>
    );
}
