import { getSystemSettingsAsync } from "@/lib/settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

export async function MaintenanceBlock({ children }: { children: React.ReactNode }) {
    const settings = await getSystemSettingsAsync();
    const session = await getServerSession(authOptions);

    const isMaintenanceMode = settings.maintenance?.maintenanceMode;
    const allowAdminAccess = settings.maintenance?.allowAdminAccess;
    const isAdmin = session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
    const blockAccess = isMaintenanceMode && (!allowAdminAccess || !isAdmin);

    const headersList = await headers();
    let clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';

    // Clean up multiple IPs (e.g., proxies)
    if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    const ipWhitelistEnabled = settings.security?.ipWhitelistEnabled;
    let finalBlockByIp = false;

    if (ipWhitelistEnabled && settings.security?.ipWhitelist) {
        const allowedIps = settings.security.ipWhitelist.split('\n').map((ip: string) => ip.trim()).filter(Boolean);
        // Extremely simple matcher, does not do CIDR for simplicity unless we install `ip` package, 
        // but let's do EXACT match for now + partial match if needed.
        if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
            finalBlockByIp = true;
        }
    }

    if (finalBlockByIp && !isAdmin) {
        return (
            <div className="fixed inset-0 z-[9999] min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4 p-4 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v-2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak (IP Blocked)</h1>
                <p className="text-gray-600 max-w-md">
                    Alamat IP Anda ({clientIp}) tidak terdaftar dalam daftar putih sistem.
                </p>
            </div>
        );
    }

    if (blockAccess) {
        return (
            <div className="fixed inset-0 z-[9999] min-h-screen flex items-center justify-center bg-gray-50 flex-col space-y-4 p-4 text-center">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Sistem Sedang Dalam Pemeliharaan</h1>
                <p className="text-gray-600 max-w-md">
                    {settings.maintenance?.maintenanceMessage || "Kami sedang melakukan update sistem untuk meningkatkan layanan. Mohon tunggu beberapa saat lagi."}
                </p>
                {!session && (
                    <div className="mt-8 text-sm text-gray-500">
                        Pastikan Anda memiliki izin akses sebagai Admin.
                    </div>
                )}
            </div>
        );
    }

    return <>{children}</>;
}
