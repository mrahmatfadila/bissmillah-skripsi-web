import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Fetching users...');
    const users = await prisma.user.findMany({
        select: {
            nik: true,
            name: true,
            role: true,
            location: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
