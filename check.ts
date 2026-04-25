import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const shifts = await prisma.shiftSchedule.findMany({
        where: { shift: 'SIANG' },
        orderBy: { date: 'asc' },
    });
    fs.writeFileSync('shift_all.txt', JSON.stringify(shifts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
