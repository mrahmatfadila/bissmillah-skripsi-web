const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Usually system settings are stored in a table or a JSON config
  // Let's find what tables exist for settings, or check the settings schema.
  // Wait, let's print all settings or search the DB.
  // In EmailService: const settings = await getSystemSettingsAsync();
  // Let's check what getSystemSettingsAsync does!
  // In src/lib/settings.ts
  const settings = await prisma.$queryRaw`SELECT * FROM "SystemSettings" LIMIT 1`.catch(err => {
      // If table name is different
      return prisma.notification.findMany({ take: 1 }); // fallback
  });
  console.log("Database Settings:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
