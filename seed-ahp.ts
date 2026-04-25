import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.aHPCriteria.deleteMany({});
    
    // Memberikan bobot persentase secara default (total 1.0)
    await prisma.aHPCriteria.createMany({
        data: [
            { name: "Urgensi", weight: 0.35 },
            { name: "Dampak", weight: 0.30 },
            { name: "Kompleksitas", weight: 0.15 },
            { name: "Cakupan", weight: 0.10 },
            { name: "Risiko", weight: 0.10 }
        ]
    });
    console.log("AHP Criteria seeded.");
}

main().catch(console.error).finally(()=>prisma.$disconnect());
