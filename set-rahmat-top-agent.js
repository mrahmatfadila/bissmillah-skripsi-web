const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rahmat = await prisma.user.findFirst({ where: { name: 'Muhamad Rahmat Fadila' } });
  
  if (!rahmat) {
    console.error("User Muhamad Rahmat Fadila not found");
    return;
  }

  // Get all resolved/closed tickets
  const tickets = await prisma.ticket.findMany({
      where: {
         status: { in: ['RESOLVED', 'CLOSED'] }
      }
  });

  if (tickets.length === 0) {
      console.log("No resolved tickets found");
      return;
  }

  // Assign around 70% or at least 10 tickets to Rahmat to make him #1
  const targetCount = Math.max(10, Math.floor(tickets.length * 0.7));
  
  let rahmatCount = 0;
  for (let i = 0; i < tickets.length; i++) {
     const t = tickets[i];
     // Make him the top
     if (i < targetCount) {
        await prisma.ticket.update({
           where: { id: t.id },
           data: { assigneeId: rahmat.id }
        });
        rahmatCount++;
     }
  }

  console.log(`Success! Assigned ${rahmatCount} resolved tickets to Muhamad Rahmat Fadila (ID: ${rahmat.id}).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
