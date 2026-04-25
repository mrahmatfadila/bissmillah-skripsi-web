import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.rolePermission.updateMany({
        where: { role: 'SUPERVISOR_SHOP' },
        data: {
            permissions: JSON.stringify(["my_tickets", "knowledge_base", "profile_settings"])
        }
    });

    const itSupport = await prisma.rolePermission.findUnique({where: {role: 'IT_SUPPORT'}});
    if (itSupport) {
        const perms = JSON.parse(itSupport.permissions);
        if (!perms.includes("profile_settings")) {
            perms.push("profile_settings");
            await prisma.rolePermission.update({
                where: {role: 'IT_SUPPORT'},
                data: {permissions: JSON.stringify(perms)}
            });
        }
    }
    console.log("Updated permissions");
}

main().catch(console.error).finally(()=>prisma.$disconnect());
