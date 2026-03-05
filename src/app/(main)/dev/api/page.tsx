"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronDown, ChevronRight, Code, Lock, Globe, Server } from "lucide-react";

interface Endpoint {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    description: string;
    auth: boolean;
    permission?: string;
    params?: string;
    response?: string;
}

interface ApiGroup {
    group: string;
    icon: React.ReactNode;
    color: string;
    endpoints: Endpoint[];
}

const METHOD_COLOR: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-600",
    POST: "bg-blue-500/20 text-blue-400 border-blue-600",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-600",
    PATCH: "bg-yellow-500/20 text-yellow-400 border-yellow-600",
    DELETE: "bg-red-500/20 text-red-400 border-red-600",
};

const API_GROUPS: ApiGroup[] = [
    {
        group: "Authentication",
        icon: <Lock className="w-4 h-4" />,
        color: "text-purple-400",
        endpoints: [
            { method: "GET", path: "/api/auth/session", auth: false, description: "Mendapatkan sesi pengguna aktif" },
            { method: "POST", path: "/api/auth/signin", auth: false, description: "Login dengan credentials" },
            { method: "POST", path: "/api/auth/signout", auth: true, description: "Logout dan hapus sesi" },
        ],
    },
    {
        group: "Tickets",
        icon: <Server className="w-4 h-4" />,
        color: "text-blue-400",
        endpoints: [
            { method: "GET", path: "/api/tickets", auth: true, description: "Ambil semua tiket (filter: status, priority, dept)", params: "?status=OPEN&priority=HIGH", response: "Ticket[]" },
            { method: "POST", path: "/api/tickets", auth: true, description: "Buat tiket baru", response: "Ticket" },
            { method: "GET", path: "/api/tickets/[id]", auth: true, description: "Detail tiket berdasarkan ID", response: "Ticket & Comments" },
            { method: "PATCH", path: "/api/tickets/[id]", auth: true, description: "Update status, assignee, atau priority tiket" },
            { method: "GET", path: "/api/tickets/stats", auth: true, description: "Statistik tiket (all, mine, unassigned, assigned)", response: "{ all, mine, unassigned, assigned }" },
            { method: "GET", path: "/api/tickets/mine", auth: true, description: "Tiket milik user yang sedang login" },
            { method: "GET", path: "/api/tickets/unassigned", auth: true, description: "Tiket belum memiliki teknisi" },
            { method: "GET", path: "/api/tickets/assigned", auth: true, description: "Tiket yang ditugaskan ke user login" },
            { method: "POST", path: "/api/tickets/[id]/assign", auth: true, description: "Assign atau reassign teknisi ke tiket", permission: "assigned_tickets" },
        ],
    },
    {
        group: "Dashboard & Analytics",
        icon: <Globe className="w-4 h-4" />,
        color: "text-cyan-400",
        endpoints: [
            { method: "GET", path: "/api/dashboard/stats", auth: true, description: "Statistik ringkasan untuk dasbor utama", response: "{ total, open, resolved, ... }" },
            { method: "GET", path: "/api/data-quality", auth: true, description: "Analisis kualitas & integritas data tiket DB", response: "{ summary, issueBreakdown, lowQualityTickets }" },
            { method: "GET", path: "/api/activity", auth: true, description: "Log aktivitas terkini (komentar, status, assign)" },
        ],
    },
    {
        group: "Users & Permissions",
        icon: <Lock className="w-4 h-4" />,
        color: "text-pink-400",
        endpoints: [
            { method: "GET", path: "/api/users", auth: true, permission: "user_management", description: "Daftar semua user terdaftar" },
            { method: "POST", path: "/api/users", auth: true, permission: "user_management", description: "Tambah user baru" },
            { method: "PUT", path: "/api/users/[id]", auth: true, permission: "user_management", description: "Update data profil user" },
            { method: "DELETE", path: "/api/users/[id]", auth: true, permission: "user_management", description: "Hapus akun user" },
            { method: "GET", path: "/api/permissions", auth: true, permission: "role_management", description: "Ambil semua data permissions per role dari DB" },
            { method: "PUT", path: "/api/permissions/update", auth: true, permission: "role_management", description: "Simpan perubahan permission ke DB" },
            { method: "GET", path: "/api/permissions/role/[role]", auth: true, description: "Ambil permission array untuk role tertentu" },
        ],
    },
    {
        group: "Knowledge Base",
        icon: <Database className="w-4 h-4" />,
        color: "text-emerald-400",
        endpoints: [
            { method: "GET", path: "/api/kb", auth: true, description: "Daftar semua artikel KB", response: "KnowledgeBase[]" },
            { method: "POST", path: "/api/kb/create", auth: true, description: "Buat artikel KB baru", permission: "knowledge_base" },
            { method: "GET", path: "/api/kb/[id]", auth: true, description: "Detail artikel KB" },
            { method: "PUT", path: "/api/kb/[id]", auth: true, description: "Update artikel KB", permission: "knowledge_base" },
            { method: "DELETE", path: "/api/kb/[id]", auth: true, description: "Hapus artikel KB", permission: "knowledge_base" },
        ],
    },
    {
        group: "AHP & Settings",
        icon: <Code className="w-4 h-4" />,
        color: "text-amber-400",
        endpoints: [
            { method: "GET", path: "/api/ahp", auth: true, permission: "ahp_config", description: "Ambil konfigurasi bobot AHP prioritas tiket" },
            { method: "PUT", path: "/api/ahp/criteria", auth: true, permission: "ahp_config", description: "Simpan bobot kriteria AHP ke DB" },
            { method: "GET", path: "/api/settings", auth: true, description: "Ambil pengaturan sistem (SLA, notif, dll)" },
            { method: "PUT", path: "/api/settings", auth: true, permission: "system_settings", description: "Update pengaturan sistem" },
        ],
    },
    {
        group: "Developer Tools",
        icon: <Code className="w-4 h-4" />,
        color: "text-purple-400",
        endpoints: [
            { method: "GET", path: "/api/dev/system-logs", auth: true, permission: "dev_tools", description: "Log aktivitas sistem dari DB real-time" },
            { method: "GET", path: "/api/dev/monitoring", auth: true, permission: "dev_tools", description: "Statistik DB komprehensif & chart data" },
        ],
    },
];

function EndpointRow({ ep }: { ep: Endpoint }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
            >
                <Badge variant="outline" className={`font-mono text-[10px] px-2 shrink-0 ${METHOD_COLOR[ep.method]}`}>
                    {ep.method}
                </Badge>
                <code className="text-xs text-green-300 flex-1 truncate">{ep.path}</code>
                {ep.auth && <Lock className="w-3 h-3 text-yellow-500 shrink-0" />}
                {ep.permission && (
                    <Badge variant="outline" className="text-[9px] border-gray-600 text-gray-400 hidden sm:flex shrink-0">
                        {ep.permission}
                    </Badge>
                )}
                {open ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
            </button>
            {open && (
                <div className="px-4 py-3 bg-gray-950 border-t border-gray-700 text-xs space-y-2">
                    <p className="text-gray-300">{ep.description}</p>
                    <div className="flex flex-wrap gap-3">
                        {ep.params && (
                            <div>
                                <span className="text-gray-500 mr-1">Query params:</span>
                                <code className="text-amber-400 bg-gray-800 px-2 py-0.5 rounded">{ep.params}</code>
                            </div>
                        )}
                        {ep.response && (
                            <div>
                                <span className="text-gray-500 mr-1">Returns:</span>
                                <code className="text-cyan-400 bg-gray-800 px-2 py-0.5 rounded">{ep.response}</code>
                            </div>
                        )}
                        {ep.auth && (
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Lock className="w-3 h-3" />
                                <span>Session required</span>
                            </div>
                        )}
                        {ep.permission && (
                            <div className="flex items-center gap-1 text-purple-400">
                                <Code className="w-3 h-3" />
                                <span>Permission: <code className="bg-gray-800 px-1 rounded">{ep.permission}</code></span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ApiDocsPage() {
    const { hasPermission, loading: permLoading } = usePermissions();
    const router = useRouter();
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!permLoading && !hasPermission("dev_tools")) {
            router.push("/tickets/mine");
        }
    }, [permLoading, hasPermission, router]);

    if (permLoading || (!hasPermission("dev_tools") && !permLoading)) return null;

    const filteredGroups = API_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(
            ep => !search || ep.path.toLowerCase().includes(search.toLowerCase()) || ep.description.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter(g => g.endpoints.length > 0);

    const totalEndpoints = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);

    return (
        <div className="min-h-screen bg-gray-950 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 px-4 md:px-8 py-8 border-b border-gray-800">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Code className="w-7 h-7 text-purple-400" />
                        Dokumentasi API
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {totalEndpoints} endpoint tersedia — IT Ticketing Support System REST API Reference
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <Badge className="bg-gray-800 text-gray-300 border-gray-600">Base URL: /api</Badge>
                        <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-700">
                            <Lock className="w-3 h-3 mr-1" /> Auth: NextAuth Session Cookie
                        </Badge>
                        <Badge className="bg-blue-900/40 text-blue-300 border-blue-700">Format: JSON</Badge>
                        <Badge className="bg-green-900/40 text-green-300 border-green-700">DB: NeonDB PostgreSQL</Badge>
                    </div>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Cari endpoint... (contoh: /api/tickets, permission)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="mt-4 w-full max-w-md bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
                {filteredGroups.map(group => (
                    <Card key={group.group} className="bg-gray-900 border-gray-700">
                        <CardHeader className="pb-3 border-b border-gray-800">
                            <CardTitle className={`text-base flex items-center gap-2 ${group.color}`}>
                                {group.icon}
                                {group.group}
                                <Badge variant="outline" className="ml-auto text-xs border-gray-600 text-gray-400">
                                    {group.endpoints.length} endpoints
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 space-y-2">
                            {group.endpoints.map(ep => (
                                <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} />
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
