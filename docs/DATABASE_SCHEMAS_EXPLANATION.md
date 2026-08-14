# Penjelasan Skema Database (8 Tabel) - IT Ticketing Support

Dokumen ini berisi penjelasan lengkap dan detail tentang **8 tabel database** yang digunakan di dalam sistem *IT Ticketing Support* Anda. Skema ini dirancang menggunakan **PostgreSQL** dan dipetakan dengan **Prisma ORM**.

---

## 1. Ringkasan Arsitektur Database
1. **Engine Database**: PostgreSQL (Relational Database Management System / RDBMS).
2. **Penyambung (ORM)**: Prisma ORM, yang secara otomatis memetakan objek kode program ke dalam tabel database.
3. **Zona Waktu (Timezone)**: Secara bawaan (*default*) database menyimpan waktu dalam format **UTC (Coordinated Universal Time)** untuk menjaga konsistensi server global, kemudian dikonversi otomatis ke **WIB (GMT+7)** pada antarmuka web (frontend).
4. **Penyimpanan Berkas Gambar/PDF**: Fisik file diunggah ke direktori server lokal (`/public/uploads`) sedangkan database hanya menyimpan string alamat URL-nya saja untuk menjaga performa database agar tetap ringan dan cepat.

---

## 2. Rincian Penjelasan 8 Tabel

### A. Tabel `User` (Data Akun Pengguna)
Berfungsi untuk menyimpan semua informasi profil, kredensial login, hak akses, dan status keamanan akun karyawan.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik acak yang dihasilkan sistem untuk mengidentifikasi akun. |
| `nik` | `String` (Unique) | Nomor Induk Karyawan. Bersifat unik dan digunakan sebagai username untuk masuk ke sistem. |
| `name` | `String` | Nama lengkap karyawan/pengguna. |
| `email` | `String?` (Unique) | Alamat email karyawan. Bersifat opsional tetapi harus unik jika diisi. |
| `password` | `String` | Kata sandi akun yang di-hash menggunakan algoritma **Bcrypt** demi keamanan. |
| `role` | `Enum` (Role) | Hak akses pengguna. Default: `SUPERVISOR_SHOP`. Pilihan: `SUPER_ADMIN`, `IT_SUPPORT`, `MANAGER`, dll. |
| `department` | `String?` | Departemen/divisi asal karyawan (Contoh: *Retail*, *Operational*, *MIS IT*). |
| `location` | `String?` | Lokasi penempatan kerja karyawan (Default: *"Kantor Jakarta"*). |
| `createdAt` | `DateTime` | Tanggal pendaftaran akun (`default(now())`). |
| `updatedAt` | `DateTime` | Tanggal pembaruan profil akun terakhir kali. |
| `image` | `String?` | URL path foto profil pengguna. |
| `failedLoginAttempts`| `Int` | Penghitung kegagalan login berturut-turut untuk keamanan (Default: `0`). |
| `lockedUntil` | `DateTime?` | Batas waktu akun terkunci sementara jika salah password berkali-kali. |

*   **Relasi**:
    *   `1 User : N Ticket Created` (Supervisor membuat banyak tiket).
    *   `1 User : N Ticket Assigned` (IT Support menerima banyak tugas tiket).
    *   `1 User : N Comment` (Menulis banyak komentar diskusi).
    *   `1 User : N KnowledgeBase` (IT Support menerbitkan banyak artikel tutorial).
    *   `1 User : N Notification` (Menerima banyak notifikasi lonceng).

---

### B. Tabel `Ticket` (Data Keluhan Gangguan IT)
Tabel transaksi utama yang mencatat keluhan, kategori, prioritas AHP, lampiran, pelapor, dan petugas penanggung jawab.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik acak sistem untuk mengidentifikasi baris tiket. |
| `ticketNumber` | `String` (Unique) | Nomor tiket resmi format unik (Contoh: `TCK-202606-001`). |
| `title` | `String` | Judul singkat keluhan kerusakan (Contoh: *"PC Kasir Mati Total"*). |
| `description` | `String` | Deskripsi detail masalah atau kronologi kerusakan IT. |
| `status` | `Enum` (Status) | Status tiket: `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED`, `CANCELLED`. |
| `priority` | `Enum` (Priority) | Prioritas penanganan: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `category` | `String?` | Kategori masalah (Contoh: *Hardware*, *Software*, *Network*). |
| `ahpScore` | `Float?` | Skor prioritas otomatis yang didapatkan dari perhitungan rumus matematika AHP. |
| `createdAt` | `DateTime` | Tanggal pertama kali tiket dibuat. |
| `updatedAt` | `DateTime` | Tanggal terakhir kali tiket diubah atau menerima pesan baru. |
| `creatorId` | `String` | **Foreign Key** yang merujuk ke `User.id` (Supervisor selaku pembuat tiket). |
| `assigneeId` | `String?` | **Foreign Key** yang merujuk ke `User.id` (IT Support selaku petugas penanggung jawab). |
| `kbArticleId` | `String?` | **Foreign Key** ke `KnowledgeBase.id` jika tiket dikonversi jadi tutorial. |
| `attachments` | `String[]` (Array) | Kumpulan path URL file bukti foto kerusakan yang diunggah. |

*   **Relasi**:
    *   `1 Ticket : N Comment` (Satu tiket menampung banyak chat diskusi).
    *   `1 Ticket : N Notification` (Satu tiket memicu banyak notifikasi lonceng).

---

### C. Tabel `Comment` (Riwayat Obrolan / Diskusi Tiket)
Menyimpan riwayat percakapan chat interaktif antara pelapor dan IT Support di dalam detail tiket.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik pesan chat. |
| `content` | `String` | Isi teks pesan obrolan yang dikirim. |
| `createdAt` | `DateTime` | Tanggal dan waktu pengiriman pesan chat. |
| `ticketId` | `String` | **Foreign Key** yang menghubungkan pesan chat ke tabel `Ticket`. |
| `authorId` | `String` | **Foreign Key** yang menghubungkan pembuat pesan ke tabel `User`. |
| `attachments` | `String[]` (Array) | URL berkas lampiran yang dikirimkan bersamaan di kolom chat. |

*   **Relasi**:
    *   Relasi many-to-one ke tabel `Ticket` dan tabel `User`.

---

### D. Tabel `KnowledgeBase` (Basis Pengetahuan / Tutorial Solusi)
Menyimpan artikel tutorial solusi masalah IT agar dapat diakses secara mandiri oleh pengguna (*self-service*).

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik artikel tutorial. |
| `title` | `String` | Judul artikel panduan (Contoh: *"Cara Mengatasi Printer Kertas Macet"*). |
| `content` | `String` | Isi teks panduan (dalam format HTML/Markdown, menyatu dengan URL gambar). |
| `category` | `String` | Pengelompokan artikel (Contoh: `IT_SUPPORT`, `GENERAL`). |
| `tags` | `String?` | Kata kunci tambahan dipisahkan koma untuk optimasi pencarian (Contoh: `printer, macet`). |
| `createdAt` | `DateTime` | Tanggal artikel diterbitkan. |
| `updatedAt` | `DateTime` | Tanggal terakhir kali artikel diedit. |
| `authorId` | `String` | **Foreign Key** pembuat artikel (merujuk ke `User.id` pengunggah/IT). |

*   **Penyimpanan Gambar**: Gambar diunggah ke `/public/uploads` di server lokal, dan alamat URL-nya dimasukkan langsung di kolom teks `content`.

---

### E. Tabel `AHPCriteria` (Kriteria Bobot AHP)
Menyimpan nilai bobot kriteria AHP (Analytical Hierarchy Process) yang dikonfigurasi oleh Admin.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik baris kriteria AHP. |
| `name` | `String` | Nama kriteria AHP (Contoh: *Cakupan*, *Dampak*, *Kompleksitas*, *Risiko*, *Urgensi*). |
| `weight` | `Float` | Bobot nilai kriteria (Desimal skala 0 s.d 1. Total semua bobot kriteria wajib = `1.0`). |
| `description` | `String?` | Deskripsi penjelasan kriteria. |
| `createdAt` | `DateTime` | Tanggal pembuatan kriteria. |
| `updatedAt` | `DateTime` | Tanggal pembaruan kriteria. |

*   **Penyajian di Layar**: Di database berupa desimal (misal: `0.1755`), di layar web dikonversi menjadi persentase berbulat satu desimal (misal: `17.6%`) agar mudah dibaca pengguna.

---

### F. Tabel `Notification` (Notifikasi Lonceng Internal)
Menyimpan data pemberitahuan internal aplikasi untuk menyalakan tanda merah pada tombol lonceng dashboard.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik baris notifikasi. |
| `userId` | `String` | **Foreign Key** penerima notifikasi (merujuk ke `User.id`). |
| `title` | `String` | Judul pemberitahuan (Contoh: *"Komentar Baru"*). |
| `message` | `String` | Isi singkat pemberitahuan. |
| `type` | `String` | Jenis notifikasi (Contoh: `'COMMENT'`, `'INFO'`). Default: `'INFO'`. |
| `read` | `Boolean` | Status baca. `false` (belum diklik / lonceng menyala merah) atau `true` (sudah dibaca). |
| `link` | `String?` | URL pengalihan halaman saat notifikasi diklik (Contoh: `/tickets/id-tiket`). |
| `createdAt` | `DateTime` | Tanggal notifikasi dikirimkan. |
| `ticketId` | `String?` | **Foreign Key** opsional yang menghubungkan ke tabel `Ticket`. |

---

### G. Tabel `ShiftSchedule` (Jadwal Kerja Staf IT Support)
Menyimpan jadwal kerja piket harian tim IT Support untuk ditampilkan di menu Kalender Shift dan Live Banner.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik baris jadwal kerja. |
| `date` | `DateTime` | Tanggal kerja berlangsung (Contoh: `2026-06-21`). |
| `shift` | `String` | Jenis shift kerja (Contoh: `"Pagi"`, `"Siang"`, atau `"Malam"`). |
| `agentName` | `String` | Nama staf IT Support penanggung jawab piket. |
| `createdAt` | `DateTime` | Tanggal pembuatan baris jadwal. |
| `updatedAt` | `DateTime` | Tanggal terakhir jadwal diubah. |

*   **Batasan Khusus (Composite Constraint)**: `@@unique([date, shift])`. Kombinasi tanggal dan shift tidak boleh kembar untuk mencegah konflik jadwal.

---

### H. Tabel `ShiftSwapRequest` (Permohonan Tukar Shift)
Mencatat transaksi pertukaran jadwal piket kerja antar-staf IT Support secara mandiri.

| Nama Kolom (Field) | Tipe Data | Keterangan / Fungsi |
| :--- | :--- | :--- |
| `id` | `String` (CUID) | **Primary Key**. ID unik pengajuan tukar shift. |
| `requesterName` | `String` | Nama staf IT yang mengajukan permohonan tukar shift. |
| `requesterShift` | `String` | Shift asal milik pemohon yang ingin ditukar. |
| `requesterDate` | `DateTime` | Tanggal shift asal pemohon yang ingin ditukar. |
| `targetName` | `String` | Nama rekan IT Support tujuan yang diajak bertukar. |
| `targetShift` | `String` | Shift milik rekan target yang ingin diambil oleh pemohon. |
| `targetDate` | `DateTime` | Tanggal shift milik rekan target yang ingin diambil. |
| `reason` | `String?` | Alasan pengajuan tukar shift. |
| `status` | `String` | Status persetujuan: `"PENDING"` (default), `"APPROVED"`, atau `"REJECTED"`. |
| `approvedBy` | `String?` | Nama/ID Manager yang menyetujui pengajuan pertukaran. |
| `approvedAt` | `DateTime?` | Waktu persetujuan dilakukan. |
| `createdAt` | `DateTime` | Tanggal pembuatan form pengajuan. |
| `updatedAt` | `DateTime` | Tanggal pembaruan status pengajuan. |

---

## 3. Tipe Data Enum (Enumerated Types)

Sistem Anda menggunakan tiga tipe data **Enum** untuk memastikan input data yang masuk ke database selalu valid dan konsisten:

1.  **`Role`** (Hak Akses):
    *   `SUPER_ADMIN`, `IT_SUPPORT`, `MANAGER`, `SUPERVISOR`, `FINANCE`, `STAFF`, `SECURITY`, `SUPERVISOR_SHOP`.
2.  **`TicketStatus`** (Perkembangan Tiket):
    *   `OPEN` (baru masuk), `IN_PROGRESS` (sedang dikerjakan), `PENDING` (tertunda menunggu suku cadang/toko konfirmasi), `RESOLVED` (selesai diperbaiki), `CLOSED` (resmi ditutup), `CANCELLED` (dibatalkan/dianggap spam).
3.  **`TicketPriority`** (Prioritas AHP):
    *   `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
