import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.aHPCriteria.findMany().then(console.log);
