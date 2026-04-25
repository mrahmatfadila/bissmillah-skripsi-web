const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let itSupport = await prisma.user.findMany({ where: { role: 'IT_SUPPORT', nik: { not: 'admin' } } });
  
  if (itSupport.length === 0) {
     itSupport = await prisma.user.findMany({ where: { role: 'IT_SUPPORT' } });
  }

  if (itSupport.length === 0) {
    console.error("No IT Support found");
    return;
  }

  const tickets = await prisma.ticket.findMany({
      where: {
         // Only modify the auto-generated ones from today basically, or just all of them 
         // since this is a dev/test environment. Let's do all to be safe.
      }
  });
  
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let updateCount = 0;

  for (const t of tickets) {
    // ALWAYS assign a user so no ticket is unassigned
    let newAssignee = t.assigneeId;
    if (!newAssignee) {
        newAssignee = getRandomItem(itSupport).id;
    }

    let newStatus = t.status;
    
    // Make sure a lot of tickets are RESOLVED so agents get points
    if (newStatus === 'OPEN' || newStatus === 'IN_PROGRESS') {
        // 80% chance to resolve
       if (Math.random() > 0.2) {
           newStatus = 'RESOLVED';
       }
    }

    await prisma.ticket.update({
       where: { id: t.id },
       data: {
          assigneeId: newAssignee,
          status: newStatus
       }
    });
    updateCount++;
  }

  console.log(`Successfully assigned and resolved agents for ${updateCount} tickets.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
