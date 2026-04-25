const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Users:', await prisma.user.count());
    console.log('Tickets:', await prisma.ticket.count());
}
main().finally(() => prisma.$disconnect());
