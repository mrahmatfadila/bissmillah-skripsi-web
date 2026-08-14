const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, nik: true, name: true, role: true }
  });
  console.log("USERS:");
  console.log(JSON.stringify(users, null, 2));

  const tickets = await prisma.ticket.findMany({
    select: { id: true, ticketNumber: true, title: true, creatorId: true, assigneeId: true }
  });
  console.log("TICKETS:");
  console.log(JSON.stringify(tickets, null, 2));
}

main().finally(() => prisma.$disconnect());
