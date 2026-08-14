const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database replacement for SUPERVISOR_SHOP users...");

  // 1. Fetch Supervisor Shop Demo password hash to copy to the new users
  const demoUser = await prisma.user.findFirst({
    where: { nik: '1120100001' }
  });

  if (!demoUser) {
    throw new Error("Could not find Supervisor Shop Demo (1120100001) in database.");
  }

  const passwordHash = demoUser.password;
  console.log(`Found demo supervisor password hash: ${passwordHash.substring(0, 10)}...`);

  // 2. Identify all SUPERVISOR_SHOP users that need to be deleted
  const usersToDelete = await prisma.user.findMany({
    where: {
      role: 'SUPERVISOR_SHOP',
      nik: { not: '1120100001' }
    },
    select: { id: true, nik: true, name: true }
  });

  console.log(`Identified ${usersToDelete.length} dummy/existing supervisor users to delete.`);
  for (const u of usersToDelete) {
    console.log(`- ${u.name} (NIK: ${u.nik})`);
  }

  // 3. Delete identified users
  if (usersToDelete.length > 0) {
    const deletedCount = await prisma.user.deleteMany({
      where: {
        id: { in: usersToDelete.map(u => u.id) }
      }
    });
    console.log(`Deleted ${deletedCount.count} users successfully.`);
  }

  // 4. Define the real users lists
  const newUsers = [
    // TERMINAL 2
    { nik: '1112040001', name: 'YULIA PASTRIA LUBIS', email: '1112040001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1112040004', name: 'Mohamad Ahyari', email: '1112040004@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1112040012', name: 'Widi Astuti', email: '1112040012@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1112060001', name: 'Nurhaity', email: '1112060001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1113120004', name: 'Amalia Nur Halimah', email: '1113120004@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1117050005', name: 'Desna Putri Sari', email: '1117050005@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1117110004', name: 'Neneng Sri Sulastri', email: '1117110004@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1120090003', name: 'Andi Srideviana', email: '1120090003@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },
    { nik: '1123030008', name: 'Aditya Sugiarta', email: '1123030008@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2' },

    // TERMINAL 3
    { nik: '1112040003', name: 'SARAH ARIMBI', email: '1112040003@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040006', name: 'SUPRIYANTA', email: '1112040006@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040007', name: 'Sri Satihani', email: '1112040007@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040008', name: 'TETI ROHAYATI', email: '1112040008@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040010', name: 'YUNI WATI', email: '1112040010@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040011', name: 'Andriyanto', email: '1112040011@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112040015', name: 'Carla Sismayani', email: '1112040015@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112060002', name: 'Dewi Lesmaya', email: '1112060002@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1112110001', name: 'Lulun Luniasari', email: '1112110001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1113050001', name: 'Tetty Hasianty S', email: '1113050001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1113060001', name: 'Angel Silia Sumarandak', email: '1113060001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1115060003', name: 'Puspita Dewi Anjani', email: '1115060003@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1116090001', name: 'Puji Septiani', email: '1116090001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1116100001', name: 'Brando Lengkey', email: '1116100001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1116110001', name: 'SUSANTHY WULANDARI', email: '1116110001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1117010001', name: 'Ellyawati', email: '1117010001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1117090001', name: 'Fernando Simanjuntak', email: '1117090001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1117100011', name: 'Afisha Listyan Martadifa', email: '1117100011@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1118090002', name: 'Rony Dewi Maratasiahaan', email: '1118090002@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1118120020', name: 'Merry Dewi Safitri', email: '1118120020@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1119010001', name: 'Lintu Budi Setiani', email: '1119010001@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1120020011', name: 'Ferawati Lestari', email: '1120020011@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1123090005', name: 'Selpia Gasela', email: '1123090005@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
    { nik: '1119020030', name: 'Ika ChristyaningYuli W', email: '1119020030@dewata.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 3' },
  ];

  // 5. Create new users
  console.log(`Inserting ${newUsers.length} new real supervisor users...`);
  let createdCount = 0;
  for (const user of newUsers) {
    await prisma.user.upsert({
      where: { nik: user.nik },
      update: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        location: user.location,
      },
      create: {
        ...user,
        password: passwordHash,
      }
    });
    createdCount++;
  }

  console.log(`Successfully upserted ${createdCount} users! Database update finished.`);
}

main()
  .catch(err => {
    console.error("Migration script failed:", err);
  })
  .finally(() => prisma.$disconnect());
