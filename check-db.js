const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { name: true, role: true, nik: true } });
    console.log("Users:", users);
  } catch (error) {
    console.error("DB connection error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
