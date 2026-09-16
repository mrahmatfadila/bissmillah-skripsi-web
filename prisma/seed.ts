import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = {
    IT_SUPPORT: [
        "dashboard", "activity_log", "unassigned_tickets",
        "assigned_tickets", "spam_tickets", "status_filters", "departments",
        "knowledge_base", "reports", "ahp_config", "user_management", "system_settings", "role_management", "upload_schedule", "shift_schedule", "profile_settings"
    ],
    SUPERVISOR_SHOP: [
        "my_tickets", "knowledge_base", "profile_settings"
    ],
};

async function main() {
    console.log('Start seeding...');

    // 2. Seed Users
    const password = await bcrypt.hash('123456', 10);

    const users = [
        // IT SUPPORT
        { nik: 'MGR_IT', name: 'Pak Robby', email: 'robby@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: 'admin', name: 'Administrator', email: 'admin@dewata.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8117110002', name: 'Zaenal Anwar', email: 'zaenal@gmail.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8123040002', name: 'Herman Santoso', email: 'herman@gmail.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8124070002', name: 'Muhamad Rahmat Fadila', email: 'mrahmatfadila@gmail.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },
        { nik: '8123040001', name: 'Ahmad Dimyati', email: 'ahmad@gmail.com', role: Role.IT_SUPPORT, department: 'IT Support', location: 'Terminal 2 & 3' },

        // SUPERVISOR SHOP DEMO
        { nik: '1120100001', name: 'Supervisor Shop Demo', email: 'matstore.sell@gmail.com', role: Role.SUPERVISOR_SHOP, department: 'Shop Operasional', location: 'Terminal 2 & 3' },

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

    for (const user of users) {
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
                password,
            },
        });
        console.log(`Seeded user: ${user.name} (${user.role})`);
    }

    // 3. Seed Knowledge Base Articles (Idempotent)
    console.log('Seeding Knowledge Base articles...');
    const adminUser = await prisma.user.findFirst({ where: { role: Role.IT_SUPPORT } });
    if (adminUser) {
        const kbArticles = [
            {
                title: 'SOP Penanganan Mesin Kasir POS Offline & Gagal Sinkronisasi',
                category: 'GENERAL',
                tags: 'POS, Kasir, Offline, Jaringan, Sinkronisasi',
                authorId: adminUser.id,
                content: `## SOP Penanganan Mesin Kasir POS Offline & Sinkronisasi Gagal\n\n### Deskripsi\nPanduan standar bagi supervisor dan kasir toko bandara saat aplikasi POS menampilkan status **OFFLINE** atau data penjualan tidak tersinkronisasi ke server pusat.\n\n### Langkah Penanganan Awal (Toko):\n1. **Periksa Kabel LAN**: Pastikan kabel jaringan di belakang CPU POS terpasang erat dan lampu indikator port menyala hijau/oranye berkedip.\n2. **Cek Koneksi Internet Toko**: Buka browser di kasir dan coba akses portal internal (http://192.168.1.1).\n3. **Restart Aplikasi POS**:\n   - Tutup aplikasi POS melalui menu *Keluar* atau tekan \`Alt + F4\`.\n   - Tunggu 10 detik lalu buka kembali shortcut POS di desktop.\n4. **Sinkronisasi Manual**: Masuk ke menu *Pengaturan* -> *Koneksi* -> klik tombol **Cek Server** lalu **Sinkronkan Sekarang**.\n\n### Eskalasi ke IT Support:\nJika dalam 5 menit status masih *OFFLINE*, segera buat tiket IT dengan prioritas **HIGH/CRITICAL** agar tim IT dapat meremote atau melakukan pengecekan port switch toko.`
            },
            {
                title: 'Panduan Troubleshooting Printer Thermal Kasir Epson TM-T82',
                category: 'GENERAL',
                tags: 'Printer, Hardware, Paper Jam, Epson, Kasir',
                authorId: adminUser.id,
                content: `## Panduan Mengatasi Gangguan Printer Thermal Kasir Epson TM-T82\n\n### Gejala Masalah:\n- Lampu LED Error berwarna merah menyala terus atau berkedip.\n- Kertas struk macet (*paper jam*) di bagian pemotong (*cutter*).\n- Struk tercetak kosong (putih) tanpa tulisan.\n\n### Langkah-langkah Solusi:\n1. **Lampu Error Berkedip & Kertas Macet**:\n   - Matikan saklar power printer (posisi OFF).\n   - Dorong tuas pembuka cover printer ke arah depan. Jika terkunci, putar roda manual pemotong di bagian dalam sedikit demi sedikit hingga cutter mundur.\n   - Tarik sisa kertas yang terjepit secara perlahan searah keluarnya kertas.\n   - Pasang kembali gulungan kertas thermal dengan orientasi keluar kertas dari bawah gulungan.\n2. **Hasil Cetak Putih/Kosong**:\n   - Pastikan jenis kertas adalah **Kertas Thermal** (bukan HVS biasa).\n   - Uji gores permukaan kertas dengan kuku; kertas thermal akan menghasilkan goresan hitam.\n3. **Self Test Printer**:\n   - Matikan printer, tekan dan tahan tombol **FEED**, lalu nyalakan power sambil tetap menahan tombol FEED selama 3 detik. Printer akan mencetak lembar diagnosa otomatis.`
            },
            {
                title: 'Solusi Cepat Gangguan Mesin EDC BCA, Mandiri & BNI',
                category: 'GENERAL',
                tags: 'EDC, Transaksi, Perbankan, Sinyal, Mandiri, BCA',
                authorId: adminUser.id,
                content: `## Solusi Gangguan Mesin EDC Toko Bandara\n\n### 1. Masalah Sinyal Hilang (*No Signal / Searching...*)\n- Restart mesin EDC dengan menekan tombol **Kuning + Titik (.)** secara bersamaan.\n- Pindahkan mesin EDC ke area dekat etalase atau jendela kaca jika menggunakan jaringan seluler GPRS.\n- Periksa SIM card di bagian bawah baterai EDC, pastikan tidak bergeser.\n\n### 2. Transaksi Declined / Line Busy:\n- Lakukan **Function 00** (Test Komunikasi) untuk memverifikasi jalur APN perbankan.\n- Cek koneksi kabel LAN jika EDC menggunakan model base ethernet docking.\n\n### 3. Settlement Gagal:\n- Periksa kertas struk, pastikan tidak habis (EDC menolak settlement jika kertas kosong).\n- Lakukan **Audit Report** terlebih dahulu sebelum menjalankan menu settlement akhir hari shift.`
            },
            {
                title: 'Panduan Perawatan & Kalibrasi Barcode Scanner Kasir',
                category: 'GENERAL',
                tags: 'Scanner, Barcode, Hardware, POS, Perawatan',
                authorId: adminUser.id,
                content: `## Panduan Perawatan Rutin Barcode Scanner Kasir\n\n### Perawatan Harian:\n1. Bersihkan kaca lensa pemindai menggunakan kain microfiber kering atau sedikit dibasahi cairan pembersih kacamata.\n2. Hindari menggunakan alkohol kadar tinggi pada kaca lensa plastik karena dapat membuat lensa buram.\n\n### Penanganan Scanner Tidak Membaca Barcode:\n1. Cek kabel konektor USB ke CPU, pastikan dicolokkan pada port USB motherboard bagian belakang CPU (port utama).\n2. Pindai lembar **Reset Default Factory Barcode** yang ada di buku manual scanner.\n3. Pastikan mode scanner berada pada konfigurasi **USB HID Keyboard Emulation** agar hasil scan langsung tertulis di layar input POS.`
            },
            {
                title: 'Prosedur Penanganan Gangguan Switch & Akses Poin Wi-Fi Toko',
                category: 'IT_SUPPORT',
                tags: 'Network, Switch, Wi-Fi, LAN, Terminal, IT Support',
                authorId: adminUser.id,
                content: `## Prosedur Teknis Penanganan Jaringan Toko Bandara (IT Only)\n\n### Prosedur Kerja Tim IT:\n1. **Pengecekan Port Switch**:\n   - Telusuri nomor port outlet wallplate toko ke patch panel rack server Terminal 2/3.\n   - Periksa status PoE pada switch Cisco/HPE untuk Access Point toko.\n2. **Konfigurasi VLAN**:\n   - Port POS Kasir: VLAN 110 (POS Operations) - DHCP Reservation berdasarkan MAC Address.\n   - Port Back Office & Printer: VLAN 120 (Office).\n3. **Troubleshooting Loss Paket / High Latency**:\n   - Jalankan ping kontinyu: \`ping 192.168.1.1 -t -l 1024\`.\n   - Lakukan tes kabel menggunakan LAN Cable Tester untuk memastikan 8 pin kabel UTP Cat6 tersambung sempurna.`
            },
            {
                title: 'SOP Eskalasi & Troubleshooting Kamera CCTV & NVR Toko',
                category: 'IT_SUPPORT',
                tags: 'Security, CCTV, NVR, Kamera, IT Support',
                authorId: adminUser.id,
                content: `## SOP Penanganan Gangguan CCTV & NVR Toko\n\n### Ruang Lingkup:\nMencakup kamera IP toko area kasir, display barang bernilai tinggi (parfum & jam tangan), dan pintu masuk toko.\n\n### Langkah Diagnosa:\n1. Periksa web interface NVR Hikvision/Dahua di IP subnet manajemen CCTV.\n2. Cek status kamera yang offline (Loss Video / IP Conflict).\n3. Lakukan power cycle pada switch PoE CCTV lantai toko bersangkutan.\n4. Jika penggantian kamera diperlukan, pastikan kamera pengganti memiliki spesifikasi minimal 4MP WDR dengan lensa 2.8mm.`
            }
        ];

        for (const kb of kbArticles) {
            const existing = await prisma.knowledgeBase.findFirst({ where: { title: kb.title } });
            if (!existing) {
                await prisma.knowledgeBase.create({ data: kb });
                console.log(`Seeded KB: ${kb.title}`);
            }
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
