"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Database, Activity, FileText, LogOut } from "lucide-react";

export default function DevLogsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const role = session?.user?.role;

    // Client-side protection
    useEffect(() => {
        if (session && role !== 'DEVELOPER') {
            router.push('/tickets/mine');
        }
    }, [session, role, router]);

    if (!session || role !== 'DEVELOPER') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
                        <p className="text-purple-100">System monitoring and development resources</p>
                    </div>
                    <Button
                        variant="outline"
                        className="text-white border-white/30 hover:bg-white/10"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <Code className="w-4 h-4 text-purple-600" />
                                API Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">Healthy</p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <Database className="w-4 h-4 text-purple-600" />
                                Database
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">Connected</p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-600" />
                                Uptime
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">99.9%</p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">1,234</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>System Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
                            <div>[2024-01-05 01:45:00] INFO: Application started</div>
                            <div>[2024-01-05 01:45:01] INFO: Database connected</div>
                            <div>[2024-01-05 01:45:02] INFO: NextAuth initialized</div>
                            <div>[2024-01-05 01:45:03] INFO: Server listening on port 3000</div>
                            <div>[2024-01-05 01:45:10] INFO: User login: Pak Robby (SUPER_ADMIN)</div>
                            <div className="text-yellow-400">[2024-01-05 01:45:15] WARN: High memory usage detected</div>
                            <div>[2024-01-05 01:45:20] INFO: Ticket created: TKT-001</div>
                            <div className="text-green-300">[2024-01-05 01:45:25] SUCCESS: Email notification sent</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
