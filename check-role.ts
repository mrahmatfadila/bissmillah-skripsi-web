import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { nik: 'MGR_IT' },
        select: { nik: true, name: true, role: true }
    });
    console.log('MGR_IT User:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
