const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { nik: '1120100001' }
  });
  console.log("DEMO USER:");
  console.log(JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
