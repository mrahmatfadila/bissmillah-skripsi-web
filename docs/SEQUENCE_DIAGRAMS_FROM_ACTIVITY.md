# Sequence Diagrams (Simple ECB/Robustness Style)

Dokumen ini berisi **Sequence Diagram** versi simpel (menggunakan gaya Entity-Control-Boundary / ECB) yang dirancang untuk mempermudah pemahaman dan presentasi sidang skripsi. Model ini mengambil garis besar alur data sistem berdasarkan activity diagram yang Anda kirimkan dan diselaraskan **100% menggunakan nama tabel asli di database PostgreSQL (Prisma)** tanpa menggunakan singkatan nama alias yang membingungkan.

---

## 1. Sequence Diagram: Diskusi & Chat
```plantuml
@startuml seq_diskusi_chat
title Sequence Diagram - Diskusi & Chat
actor "Supervisor Shop / IT Support" as User
boundary "Detail Tiket (UI)" as Detail
control "Proses Chat" as Proses
entity "Ticket" as Ticket
entity "Comment" as Comment
entity "Notification" as Notification
control "WhatsApp & Email" as Notif

User -> Detail: Pilih Tiket()
Detail -> Proses: Get Detail Tiket()
Proses -> Ticket: Get Data Tiket()
Ticket --> Proses: Kirim Data Tiket()
Proses -> Detail: Tampilkan Detail Tiket()

User -> Detail: Masuk Tab Diskusi & Chat()
User -> Detail: Ketik Pesan & Lampiran()
User -> Detail: Klik Kirim()

Detail -> Proses: Kirim Pesan()
Proses -> Comment: Simpan Komentar & Lampiran()
Comment --> Proses: Konfirmasi Berhasil Simpan()
Proses -> Notification: Simpan Data Notifikasi (Lonceng)()
Notification --> Proses: Konfirmasi Notifikasi Tersimpan()
Proses -> Notif: Kirim Notifikasi WA/Email()
Proses -> Detail: Segarkan Percakapan()
Detail --> User: Tampilkan Komentar Baru()
@enduml
```

---

## 2. Sequence Diagram: Kelola Kriteria AHP (IT/Admin)
```plantuml
@startuml seq_kelola_ahp_kriteria
title Sequence Diagram - Kelola Kriteria AHP (IT/Admin)
actor "IT Support (Admin)" as Admin
boundary "Konfigurasi AHP" as Form
control "Proses AHP" as Proses
entity "AHPCriteria" as AHPCriteria

Admin -> Form: Buka Menu Konfigurasi AHP()
Form -> Proses: Get Data Kriteria()
Proses -> AHPCriteria: Get Kriteria()
AHPCriteria --> Proses: Kirim Data Kriteria()
Proses -> Form: Menampilkan Kriteria & Matriks()

Admin -> Form: Tambah/Edit/Hapus Kriteria()
Admin -> Form: Bandingkan Kriteria (Saaty Scale 1-9)()

Admin -> Form: Klik Hitung Bobot AHP()
Form -> Proses: Hitung Bobot & CR()
Proses -> Proses: Kalkulasi CR & Bobot()
Proses --> Form: Menampilkan CR (Consistency Ratio)()

note over Admin: Validasi Hasil\n(CR <= 0.1)

Admin -> Form: Klik Simpan Konfigurasi()
Form -> Proses: Simpan Konfigurasi()
Proses -> AHPCriteria: Update Kriteria & Bobot Baru()
AHPCriteria --> Proses: Konfirmasi Sukses Simpan()
Proses -> Form: Tampilkan Pop-up Pesan Sukses()
@enduml
```

---

## 3. Sequence Diagram: Melihat Status Tiket
```plantuml
@startuml seq_melihat_status_tiket
title Sequence Diagram - Melihat Status Tiket
actor "Supervisor Shop" as User
boundary "Menu Tiket Saya" as UI
control "Proses Tiket" as Proses
entity "Ticket" as Ticket

User -> UI: Buka Menu Tiket Saya()
UI -> Proses: Get Daftar Tiket()
Proses -> Ticket: Get Data Tiket User()
Ticket --> Proses: Kirim Daftar Tiket()
Proses -> UI: Menampilkan Daftar Tiket & Status()

opt Menggunakan Filter Status (Optional)
  User -> UI: Pilih Filter Status()
  UI -> Proses: Filter Tiket()
  Proses -> Ticket: Get Data Terfilter()
  Ticket --> Proses: Kirim Data Terfilter()
  Proses -> UI: Menampilkan Daftar Tiket Terfilter()
end

UI --> User: Melihat Status Tiket Terkini()
@enduml
```

---

## 4. Sequence Diagram: Melihat Tiket yang Ditugaskan
```plantuml
@startuml seq_melihat_tiket_ditugaskan
title Sequence Diagram - Melihat Tiket yang Ditugaskan
actor "IT Support" as IT
boundary "Menu Tugas Saya" as UI
control "Proses Tugas" as Proses
entity "Ticket" as Ticket

IT -> UI: Buka Menu Tugas Saya()
UI -> Proses: Get Tiket Ditugaskan()
Proses -> Ticket: Get Tiket IT Support()
Ticket --> Proses: Kirim Daftar Tiket()
Proses -> UI: Menampilkan Halaman Tugas Saya()

opt Memilih filter atau pengurutan tiket (opsional)
  IT -> UI: Pilih Filter / Pengurutan()
  UI -> Proses: Filter & Urutkan()
  Proses -> Ticket: Get Data Terfilter & Terurut()
  Ticket --> Proses: Kirim Data Hasil Filter()
  Proses -> UI: Menampilkan Daftar Tiket Terfilter()
end

UI --> IT: Melihat Daftar Tiket yang Ditugaskan()
@enduml
```

---

## 5. Sequence Diagram: Melihat Laporan Analitik
```plantuml
@startuml seq_melihat_laporan_analitik
title Sequence Diagram - Melihat Laporan Analitik
actor "IT Support" as IT
boundary "Laporan Analitik" as UI
control "Proses Laporan" as Proses
entity "Ticket" as Ticket
boundary "File PDF" as PDF

IT -> UI: Buka Menu Laporan Analitik()
UI -> Proses: Get Data Analitik()
Proses -> Ticket: Get Agregasi Data SLA & KPI()
Ticket --> Proses: Kirim Data Statistik()
Proses -> UI: Tampilkan Grafik & Statistik()

opt Mengunduh Laporan = Ya
  IT -> UI: Klik Unduh PDF()
  UI -> Proses: Generate Laporan PDF()
  Proses -> PDF: Cetak Laporan PDF()
  PDF -> UI: Pop-up Berhasil Dibuat()
  UI --> IT: Melihat Laporan dalam Bentuk PDF()
end
@enduml
```

---

## 6. Sequence Diagram: Membaca Knowledge Base
```plantuml
@startuml seq_membaca_kb
title Sequence Diagram - Membaca Knowledge Base
actor "Supervisor Shop" as User
boundary "Menu Knowledge Base" as UI
control "Proses Pencarian" as Proses
entity "KnowledgeBase" as KnowledgeBase

User -> UI: Masuk Menu Knowledge Base()
User -> UI: Masukkan Kata Kunci()
UI -> Proses: Cari Artikel()
Proses -> KnowledgeBase: Query Artikel Relevan()
KnowledgeBase --> Proses: Return Data Artikel()

alt Artikel Ditemukan = Ya
  Proses -> UI: Tampilkan Daftar Artikel Terkait()
  User -> UI: Pilih & Klik Judul Artikel()
  UI -> Proses: Get Detail Artikel()
  Proses -> KnowledgeBase: Query Detail Artikel()
  KnowledgeBase --> Proses: Return Isi Artikel()
  Proses -> UI: Tampilkan Isi Artikel Solusi()
  UI --> User: Membaca Artikel Solusi()
else Artikel Ditemukan = Tidak
  Proses -> UI: Tampilkan Tidak Ada Artikel Ditemukan()
  UI --> User: Tampilkan Form Pencarian Ulang()
end
@enduml
```

---

## 7. Sequence Diagram: Membuat Tiket
```plantuml
@startuml seq_membuat_tiket
title Sequence Diagram - Membuat Tiket
actor "Supervisor Shop" as User
boundary "Menu Tiket Saya" as UI
boundary "Form Tiket" as Form
control "Proses Tiket" as Proses
entity "Ticket" as Ticket

User -> UI: Buka Menu Tiket Saya()
User -> UI: Klik Buat Tiket Baru()
UI -> Form: Tampilkan Form Tiket()
User -> Form: Isi Data Tiket()
User -> Form: Klik Kirim Tiket()
Form -> Proses: Validasi & Simpan()

alt Validasi = Ya
  Proses -> Ticket: Simpan Tiket ke Database()
  Ticket --> Proses: Konfirmasi Tiket Tersimpan()
  Proses -> Form: Tampilkan Pop-up Sukses()
  Form --> User: Selesai (Redirect ke Daftar Tiket)()
else Validasi = Tidak
  Proses -> Form: Tampilkan Pesan Error()
  Form --> User: Minta Perbaiki Form()
end
@enduml
```

---

## 8. Sequence Diagram: Mengambil Tiket
```plantuml
@startuml seq_mengambil_tiket
title Sequence Diagram - Mengambil Tiket
actor "IT Support" as IT
boundary "Menu Belum Ditugaskan" as UI
control "Proses Klaim" as Proses
entity "Ticket" as Ticket

IT -> UI: Buka Menu "Belum Ditugaskan"()
UI -> Proses: Get Tiket Baru()
Proses -> Ticket: Query Tiket Unassigned()
Ticket --> Proses: Return Daftar Tiket()
Proses -> UI: Menampilkan Data Tiket Baru()

IT -> UI: Memilih Tiket Baru()
IT -> UI: Mengklik Tombol "Ambil Tiket"()
UI -> Proses: Klaim Tiket()
Proses -> Ticket: Update Assignee & Status Tiket()
Ticket --> Proses: Konfirmasi Update Sukses()
Proses -> UI: Tampilkan Pop-up Berhasil Diambil Alih()
UI --> IT: Tiket Pindah ke Halaman Tugas Saya()
@enduml
```

---

## 9. Sequence Diagram: Membuat Artikel Knowledge Base
```plantuml
@startuml seq_membuat_artikel_kb
title Sequence Diagram - Membuat Artikel Knowledge Base
actor "IT Support" as IT
boundary "Halaman KB" as UI
boundary "Form Artikel Baru" as Form
control "Proses Artikel" as Proses
entity "KnowledgeBase" as KnowledgeBase

IT -> UI: Buka Halaman Knowledge Base()
UI -> Proses: Get Daftar Artikel()
Proses -> KnowledgeBase: Query Artikel()
KnowledgeBase --> Proses: Return Artikel()
Proses -> UI: Menampilkan Halaman Knowledge Base()

IT -> UI: Tekan Tombol "Buat Artikel Baru"()
UI -> Form: Menampilkan Halaman Buat Artikel Baru()

IT -> Form: Isi Judul, Kategori, Tags & Konten()
IT -> Form: Tekan Tombol "Terbitkan Artikel"()
Form -> Proses: Simpan Artikel Baru()
Proses -> KnowledgeBase: Simpan Data Artikel ke Database()
KnowledgeBase --> Proses: Konfirmasi Artikel Tersimpan()
Proses -> Form: Tampilkan Pop-up Artikel Sukses Dibuat()
Form --> IT: Selesai (Redirect ke Daftar KB)()
@enduml
```

---

## 10. Sequence Diagram: Menerima Notifikasi
```plantuml
@startuml seq_menerima_notifikasi
title Sequence Diagram - Menerima Notifikasi
actor "IT Support / Pengguna" as User
boundary "Ikon Lonceng / Email / WA" as UI
control "Proses Notifikasi" as Proses
entity "Notification" as Notification

Note over Proses: Trigger Aksi Terjadi\n(Tiket Baru/Update/Komentar)

Proses -> Notification: Simpan Data Notifikasi ke Database()
Notification --> Proses: Konfirmasi Tersimpan()
Proses -> UI: Kirim Email / Pesan WhatsApp()
UI --> User: Menerima Notifikasi & Indikator Lonceng Berubah()

User -> UI: Klik Ikon Lonceng / Buka Link Email & WA()
UI -> Proses: Akses Link Tiket()
Proses -> UI: Arahkan & Tampilkan Detail Tiket Terkait()
@enduml
```

---

## 11. Sequence Diagram: Mengelola Pengguna
```plantuml
@startuml seq_mengelola_pengguna
title Sequence Diagram - Mengelola Pengguna
actor "IT Support (Admin)" as Admin
boundary "Manajemen User (UI)" as UI
boundary "Form User" as Form
control "Proses User" as Proses
entity "User" as UserEntity

Admin -> UI: Buka Menu Manajemen User()
UI -> Proses: Get Semua User()
Proses -> UserEntity: Query User()
UserEntity --> Proses: Return Daftar User()
Proses -> UI: Tampilkan Halaman Manajemen User()

alt Aksi = Tambah
  Admin -> UI: Klik "Add User"()
  UI -> Form: Tampilkan Form Tambah()
  Admin -> Form: Isi Data (NIK, Nama, Email, Password, Role, dll)()
  Admin -> Form: Klik "Create User"()
  Form -> Proses: Simpan User Baru()
  Proses -> UserEntity: Insert User Baru()
  UserEntity --> Proses: Konfirmasi Sukses()
  Proses -> UI: Tampilkan Pop-up "User created successfully"()
  UI -> UI: Segarkan Halaman & Tampilkan Data Terbaru()
else Aksi = Edit
  Admin -> UI: Klik Icon Edit User()
  UI -> Form: Tampilkan Form Edit dengan Data User()
  Admin -> Form: Ubah Data User()
  Admin -> Form: Klik "Update User"()
  Form -> Proses: Update Data User()
  Proses -> UserEntity: Update User di Database()
  UserEntity --> Proses: Konfirmasi Sukses()
  Proses -> UI: Tampilkan Pop-up "User updated successfully"()
  UI -> UI: Segarkan Halaman & Tampilkan Data Terbaru()
else Aksi = Hapus
  Admin -> UI: Klik Icon Delete User()
  UI -> UI: Tampilkan Konfirmasi Hapus()
  Admin -> UI: Klik tombol "Delete"()
  UI -> Proses: Hapus User()
  Proses -> UserEntity: Delete User dari Database()
  UserEntity --> Proses: Konfirmasi Sukses()
  Proses -> UI: Tampilkan Pop-up "User deleted successfully"()
  UI -> UI: Segarkan Halaman & Tampilkan Data Terbaru()
end
@enduml
```

---

## 12. Sequence Diagram: Mengembalikan Tiket Dibatalkan (Restore)
```plantuml
@startuml seq_mengembalikan_tiket_dibatalkan
title Sequence Diagram - Mengembalikan Tiket Dibatalkan (Restore)
actor "IT Support" as IT
boundary "Menu Spam" as UI
control "Proses Restore" as Proses
entity "Ticket" as Ticket

IT -> UI: Buka Menu "Spam"()
UI -> Proses: Get Tiket Spam()
Proses -> Ticket: Query Tiket dengan Status CANCELLED()
Ticket --> Proses: Return Daftar Tiket Spam()
Proses -> UI: Menampilkan Daftar Tiket Spam/Dibatalkan()

IT -> UI: Memilih Tiket untuk Dikembalikan()
IT -> UI: Menekan tombol "Pulihkan"()
UI -> Proses: Restore Tiket()
Proses -> Ticket: Update Status Tiket = OPEN()
Ticket --> Proses: Konfirmasi Update Sukses()
Proses -> UI: Menampilkan Pop-up Tiket Berhasil Dipulihkan()
UI --> IT: Selesai (Tiket Kembali ke Daftar Aktif)()
@enduml
```

---

## 13. Sequence Diagram: Mengubah Status Tiket
```plantuml
@startuml seq_mengubah_status_tiket
title Sequence Diagram - Mengubah Status Tiket
actor "IT Support" as IT
boundary "Detail Tiket" as UI
control "Proses Status" as Proses
entity "Ticket" as Ticket

IT -> UI: Buka Halaman Detail Tiket()
IT -> UI: Klik Dropdown "Status Saat Ini"()
UI -> UI: Tampilkan Daftar Pilihan Status Tiket()

IT -> UI: Memilih Status Baru()
UI -> Proses: Kirim Status Baru()
Proses -> Ticket: Simpan Perubahan Status ke Database()
Ticket --> Proses: Konfirmasi Update Sukses()
Proses -> UI: Memperbarui Tampilan UI dengan Status Baru()
UI --> IT: Selesai()
@enduml
```

---

## 14. Sequence Diagram: Login
```plantuml
@startuml seq_login
title Sequence Diagram - Login
actor "IT Support / Pengguna" as User
boundary "Form Login (UI)" as UI
control "Proses Login" as Proses
entity "User" as UserEntity
boundary "Halaman Utama" as Utama

User -> UI: Membuka Aplikasi()
UI -> User: Menampilkan Halaman Login()

User -> UI: Masukan NIK dan Kata sandi()
UI -> Proses: Validasi Login()
Proses -> UserEntity: Query User berdasarkan NIK()
UserEntity --> Proses: Return Data User & Password Hash()
Proses -> Proses: Cocokkan Password (Bcrypt)()

alt Validasi = Yes (Sukses)
  Proses -> Utama: Tampilkan Halaman Utama()
  Utama --> User: Selamat Datang di Dashboard()
else Validasi = No (Gagal)
  Proses -> UI: Tampilkan Halaman Login & Pesan Error()
end
@enduml
```
