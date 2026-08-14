import { PrismaClient } from '@prisma/client';
import { EmailService } from '../src/lib/email';
const prisma = new PrismaClient();

async function test() {
    console.log("Fetching ticket...");
    const ticket = await prisma.ticket.findFirst({
        where: { creator: { email: { not: null } } },
        include: { creator: true }
    });
    if (!ticket) {
        console.log("No ticket found with a creator email.");
        return;
    }
    console.log("Ticket creator email:", ticket.creator.email);
    console.log("Creator ID:", ticket.creatorId);
    
    console.log("Sending email...");
    const result = await EmailService.notifyTicketStatusChange(ticket, "OPEN", "IN_PROGRESS", "Admin Test");
    console.log("Email test completed, result:", result);
}

test().catch(console.error).finally(() => prisma.$disconnect());
