import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { IssueTable } from "@/components/dashboard/issue-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CCTVIssuesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    // Fetch CCTV-related tickets
    const tickets = await prisma.ticket.findMany({
        where: {
            OR: [
                { category: 'CCTV' },
                { category: 'SECURITY' },
                { title: { contains: 'CCTV', mode: 'insensitive' } },
                { description: { contains: 'CCTV', mode: 'insensitive' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            creator: { select: { name: true, department: true, image: true, role: true } },
            assignee: { select: { name: true, role: true, image: true } }
        }
    });

    return (
        <div className="p-6 space-y-6 min-h-screen bg-gray-50/50">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Camera className="text-red-600" /> Masalah CCTV
                    </h1>
                    <p className="text-gray-500 text-sm">Daftar tiket terkait sistem CCTV dan keamanan</p>
                </div>
                <Link href="/tickets/create?category=CCTV">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Lapor Masalah CCTV
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Tiket CCTV</CardTitle>
                </CardHeader>
                <CardContent>
                    <IssueTable tickets={tickets} />
                </CardContent>
            </Card>
        </div>
    );
}
