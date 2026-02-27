import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketDetailClient from "./ticket-detail-client";

export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            creator: {
                select: { id: true, name: true, role: true, department: true, image: true }
            },
            assignee: {
                select: { id: true, name: true }
            },
            comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: { id: true, name: true, role: true, image: true } }
                }
            }
        }
    });

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Ticket not found</p>
            </div>
        );
    }

    return (
        <TicketDetailClient ticket={ticket} currentUser={session.user} />
    );
}
