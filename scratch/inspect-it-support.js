const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itSupportUsers = await prisma.user.findMany({
    where: { role: 'IT_SUPPORT' }
  });
  console.log("IT SUPPORT USERS IN DB:");
  console.log(JSON.stringify(itSupportUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
