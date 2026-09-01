import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeaderWrapper as DashboardHeader } from "@/components/layout/dashboard-header-wrapper";
import { MaintenanceBlock } from "@/components/maintenance-block";
import { Footer } from "@/components/layout/footer";
import { LiveShiftBanner } from "@/components/live-shift-banner";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/');
    }
    return (
        <div className="h-full relative flex flex-col min-w-0 w-full overflow-x-hidden">
            <MaintenanceBlock>
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar />
                </div>
                <main className="md:pl-72 flex-1 w-full min-w-0 flex flex-col min-h-screen">
                    <DashboardHeader />
                    <LiveShiftBanner />
                    {/* Increased pt to account for the banner 73px header + 40px banner = 113px */}
                    <div className="w-full min-w-0 flex-1 pb-10 pt-[113px]">
                        {children}
                    </div>
                    <Footer />
                </main>
            </MaintenanceBlock>
        </div>
    );
}


