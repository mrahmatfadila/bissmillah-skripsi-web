import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json({ tickets: [], articles: [] });
    }

    try {
        const [tickets, articles] = await Promise.all([
            prisma.ticket.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { description: { contains: query } },
                        { ticketNumber: { contains: query } }
                    ]
                },
                take: 5,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    ticketNumber: true,
                    title: true,
                    status: true
                }
            }),
            prisma.knowledgeBase.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { content: { contains: query } },
                        { tags: { contains: query } }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    category: true
                }
            })
        ]);

        return NextResponse.json({ tickets, articles });
    } catch (error) {
        console.error("Search error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
