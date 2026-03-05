"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Shield, Check, X, Save, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface Permission {
    id: string;
    label: string;
    description: string;
}

interface RolePermissionData {
    id: string;
    role: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}

const PERMISSIONS: Permission[] = [
    { id: "dashboard", label: "Dashboard", description: "Melihat ringkasan dasbor log masuk" },
    { id: "activity_log", label: "Log Aktivitas", description: "Melihat log log sejarah aktivitas sistem" },
    { id: "my_tickets", label: "Manajemen Tiket (Root)", description: "Perlu untuk membuka menu utama Tiket Saya" },
    { id: "unassigned_tickets", label: "Tiket Belum Ditugaskan", description: "Melihat dan mengklaim tiket baru" },
    { id: "assigned_tickets", label: "Tugas Saya", description: "Melihat semua tiket yang ditugaskan ke Anda" },
    { id: "spam_tickets", label: "Tiket Spam", description: "Kemampuan memantau kotak spam" },
    { id: "status_filters", label: "Filter Status", description: "Melihat daftar tiket yang dikategorikan status" },
    { id: "departments", label: "Filter Departemen", description: "Klasifikasi tiket berdasarkan departemen creator" },
    { id: "knowledge_base", label: "Knowledge Base", description: "Melihat artikel database panduan permasalahan" },
    { id: "cctv_issues", label: "Masalah CCTV", description: "Melihat daftar rekaman kerusakan spesifik CCTV" },
    { id: "edc_issues", label: "Masalah EDC", description: "Daftar pemeliharaan spesifik EDC" },
    { id: "reports", label: "Laporan Analitik", description: "Melihat laporan kinerja komprehensif" },
    { id: "data_quality", label: "Kualitas Data", description: "Tinjau skor anomali & kelengkapan deskripsi" },
    { id: "ahp_config", label: "Konfigurasi AHP", description: "Manajemen prioritas otomatis SPK AHP" },
    { id: "user_management", label: "Manajemen User", description: "Akses menambah, merubah, & menghapus profil user" },
    { id: "role_management", label: "Peran & Akses", description: "Ubah halaman matriks izin fitur ini" },
    { id: "system_settings", label: "Pengaturan Sistem", description: "Akses edit SLA, Security, Jadwal, & Notifikasi" },
    { id: "dev_tools", label: "Developer Tools", description: "Melihat system API, log error dan Semua Tiket" },
    { id: "profile_settings", label: "Pengaturan Profil", description: "Akses mengubah profil dan preferensi pribadi" },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
    IT_SUPPORT: { label: "IT Support", color: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
    MANAGER: { label: "Manager", color: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    SUPERVISOR: { label: "Supervisor", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    FINANCE: { label: "Finance", color: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
    STAFF: { label: "Staff", color: "bg-muted text-foreground/80 border-border" },
    SECURITY: { label: "Security", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
};

export default function RolePermissionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [rolePermissions, setRolePermissions] = useState<RolePermissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const { hasPermission: currentUserHasPermission, loading: permsLoading } = usePermissions();

    useEffect(() => {
        if (!permsLoading && !currentUserHasPermission('role_management')) {
            router.push('/dashboard');
        }
    }, [permsLoading, currentUserHasPermission, router]);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/permissions');
            if (response.ok) {
                const data: RolePermissionData[] = await response.json();

                // Ensure all roles from ROLE_LABELS exist in the state
                const allRoles = Object.keys(ROLE_LABELS).map(roleKey => {
                    const existing = data.find(d => d.role === roleKey);
                    return existing || {
                        id: `temp-${roleKey}`,
                        role: roleKey,
                        permissions: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                });

                setRolePermissions(allRoles);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Failed to fetch permissions');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (role: string, permissionId: string) => {
        setRolePermissions(prev => prev.map(rp => {
            if (rp.role === role) {
                const hasPermission = rp.permissions.includes(permissionId);
                return {
                    ...rp,
                    permissions: hasPermission
                        ? rp.permissions.filter(p => p !== permissionId)
                        : [...rp.permissions, permissionId]
                };
            }
            return rp;
        }));
        setHasChanges(true);
    };

    const savePermissions = async () => {
        try {
            setSaving(true);

            for (const rp of rolePermissions) {
                const response = await fetch('/api/permissions/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: rp.role,
                        permissions: rp.permissions,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to update ${rp.role}`);
                }
            }

            toast.success('Permissions saved successfully');
            setHasChanges(false);
            fetchPermissions();
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const hasPermission = (role: string, permissionId: string) => {
        const roleData = rolePermissions.find(rp => rp.role === role);
        return roleData?.permissions.includes(permissionId) || false;
    };

    if (!session || (!permsLoading && !currentUserHasPermission('role_management'))) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background/50">
            <div className="bg-card border-b border-border px-4 md:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-[1400px] mx-auto gap-4 sm:gap-0">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            Role & Permissions
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Configure permissions for each role by checking/unchecking boxes
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={fetchPermissions}
                            disabled={loading || saving}
                            className="flex-1 sm:flex-none"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={savePermissions}
                            disabled={!hasChanges || saving}
                            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none whitespace-nowrap"
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 md:space-y-6">
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/30">
                    <CardHeader>
                        <CardTitle className="text-base text-blue-900 dark:text-blue-200">Editable Permission Matrix</CardTitle>
                        <CardDescription className="text-blue-700 dark:text-blue-400">
                            Click on checkboxes to enable/disable permissions for each role. Don't forget to save your changes!
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted">
                                            <TableHead className="w-[250px] font-semibold sticky left-0 bg-muted z-10">
                                                Permission / Feature
                                            </TableHead>
                                            {rolePermissions.map((rp) => (
                                                <TableHead key={rp.role} className="text-center min-w-[120px]">
                                                    <Badge className={ROLE_LABELS[rp.role]?.color + " font-normal text-xs"}>
                                                        {ROLE_LABELS[rp.role]?.label || rp.role}
                                                    </Badge>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {PERMISSIONS.map((permission) => (
                                            <TableRow key={permission.id} className="hover:bg-background/50">
                                                <TableCell className="sticky left-0 bg-card z-10 border-r">
                                                    <div>
                                                        <div className="font-medium text-sm">{permission.label}</div>
                                                        <div className="text-xs text-muted-foreground">{permission.description}</div>
                                                    </div>
                                                </TableCell>
                                                {rolePermissions.map((rp) => (
                                                    <TableCell key={rp.role} className="text-center">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                checked={rp.role === 'SUPER_ADMIN' || hasPermission(rp.role, permission.id)}
                                                                onCheckedChange={() => togglePermission(rp.role, permission.id)}
                                                                disabled={rp.role === 'SUPER_ADMIN'}
                                                                className="w-5 h-5"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {hasChanges && (
                    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/30">
                        <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                                    You have unsaved changes. Click "Save Changes" to apply them.
                                </p>
                                <Button
                                    onClick={savePermissions}
                                    disabled={saving}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
