const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supervisors = await prisma.user.findMany({ where: { role: 'SUPERVISOR_SHOP' } });
  let itSupport = await prisma.user.findMany({ where: { role: 'IT_SUPPORT', nik: { not: 'admin' } } });
  
  if (itSupport.length === 0) {
     itSupport = await prisma.user.findMany({ where: { role: 'IT_SUPPORT' } });
  }

  if (supervisors.length === 0 || itSupport.length === 0) {
    console.error("Not enough users to seed tickets. Ensure SPV and IT_SUPPORT users exist.");
    return;
  }

  const categories = ['Hardware', 'Software', 'Jaringan', 'Printer_Scanner', 'Sistem_POS'];
  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  console.log("Generating 20 random tickets...");

  const generateTicketNumber = (i) => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `TKT-${yyyy}${mm}${dd}-${randomNum}${i}`;
  };

  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomDate = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000); // Past 6 days
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  for (let i = 0; i < 20; i++) {
    const creator = getRandomItem(supervisors);
    const assignee = Math.random() > 0.4 ? getRandomItem(itSupport) : null; 
    let status = assignee ? getRandomItem(['IN_PROGRESS', 'RESOLVED', 'CLOSED']) : 'OPEN';
    
    const createdAt = getRandomDate();
    let ahpScore = (Math.random() * (5.0 - 1.0) + 1.0); // 1.0 to 5.0
    let priority;
    if (ahpScore >= 4.0) priority = 'CRITICAL';
    else if (ahpScore >= 3.0) priority = 'HIGH';
    else if (ahpScore >= 2.0) priority = 'MEDIUM';
    else priority = 'LOW';

    const categoryStr = getRandomItem(categories);

    await prisma.ticket.create({ 
        data: {
            ticketNumber: generateTicketNumber(i),
            title: `Kendala ${categoryStr} di Area ${creator.department.split(' ')[0]} ${creator.location} - Case ${i+1}`,
            description: `Terdapat kendala operasional yang berkaitan dengan ${categoryStr.replace('_',' ')} pada area ${creator.location}. Mohon tim IT segera mengecek karena operasional agak terganggu. Kondisi di lapangan: ${getRandomItem(['Mesin tidak menyala', 'Koneksi terputus tiba-tiba', 'Aplikasi error tidak bisa login', 'Tinta habis atau macet'])}.`,
            status,
            priority,
            category: categoryStr,
            creatorId: creator.id,
            assigneeId: assignee?.id || null,
            ahpScore,
            createdAt,
            updatedAt: new Date(createdAt.getTime() + Math.random() * 86400000)
        } 
    });
  }

  console.log("Successfully created 20 tickets!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
