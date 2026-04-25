import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.aHPCriteria.deleteMany({});
    
    // Default weights from equal comparison (1/5)
    await prisma.aHPCriteria.createMany({
        data: [
            { name: "Urgency", weight: 0.2 },
            { name: "Impact", weight: 0.2 },
            { name: "Complexity", weight: 0.2 },
            { name: "Scope", weight: 0.2 },
            { name: "Risk Factor", weight: 0.2 },
        ]
    });
    console.log("Seeded 5 AHP criteria successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
