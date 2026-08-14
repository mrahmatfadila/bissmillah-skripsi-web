# Activity Diagrams - IT Ticketing Support

Dokumen ini menyajikan Activity Diagram untuk sistem IT Ticketing Support yang selaras secara presisi (1:1) dengan 14 use case pada Use Case Diagram. Setiap diagram memisahkan tanggung jawab menggunakan swimlane PlantUML antara Aktor dan Sistem.

---

## 1. Login
*Aktivitas untuk memvalidasi kredensial pengguna dan mengarahkan ke dashboard yang sesuai.*

```plantuml
@startuml activity_login
title Activity Diagram - Login
|Pengguna (Supervisor/IT)|
start
:Buka Halaman Login;
:Masukkan Email/NIK & Password;
:Klik Tombol Login;
|Sistem|
:Validasi Kredensial;
if (Kredensial Valid?) then (Ya)
  :Buat Session & Cek Role;
  :Arahkan ke Halaman Utama;
  |Pengguna (Supervisor/IT)|
  :Masuk ke Dashboard Utama;
else (Tidak)
  :Tampilkan Pesan Error;
  |Pengguna (Supervisor/IT)|
  :Kembali ke Form Login;
endif
stop
@enduml
```

---

## 2. Membuat Tiket
*Aktivitas untuk mengajukan tiket permasalahan baru lengkap dengan kuesioner prioritas AHP.*

```plantuml
@startuml activity_membuat_tiket
title Activity Diagram - Membuat Tiket (Supervisor Shop)
|Supervisor Shop|
start
:Akses Form Buat Tiket;
:Isi Judul, Deskripsi, Kategori & Lokasi;
:Isi Kuesioner AHP (Dampak & Urgensi);
:Upload Lampiran Bukti (Opsional);
:Klik "Kirim Tiket";
|Sistem|
if (Validasi Input?) then (Valid)
  :Hitung Prioritas berdasarkan Nilai AHP;
  :Simpan Tiket ke Database (Status: OPEN);
  :Kirim Notifikasi Baru ke IT Support;
  |Supervisor Shop|
  :Menerima Pop-up Tiket Berhasil Dibuat;
else (Tidak Valid)
  |Sistem|
  :Tampilkan Pesan Error Input;
  |Supervisor Shop|
  :Perbaiki Isian Form;
endif
stop
@enduml
```

---

## 3. Melihat Status Tiket
*Aktivitas bagi pembuat tiket untuk memantau perkembangan dan riwayat status tiketnya.*

```plantuml
@startuml activity_melihat_status_tiket
title Activity Diagram - Melihat Status Tiket (Supervisor Shop)
|Supervisor Shop|
start
:Buka Menu "Tiket Saya";
|Sistem|
:Reload / Memuat Ulang Data Tiket;
:Menampilkan Daftar Tiket (Termasuk Badge Status);
|Supervisor Shop|
:Gunakan Filter Status / Prioritas (Opsional);
|Sistem|
:Saring & Urutkan Daftar Tiket;
:Tampilkan Daftar Tiket Terfilter;
|Supervisor Shop|
:Melihat Status Tiket Terkini;
stop
@enduml
```

---

## 4. Diskusi & Chat
*Aktivitas komunikasi/tanya jawab interaktif antara pelapor dan teknisi di halaman detail tiket.*

```plantuml
@startuml activity_diskusi_chat
title Activity Diagram - Diskusi & Chat
|Pengguna (Supervisor/IT)|
start
:Buka Detail Tiket (Tab Diskusi & Chat);
:Ketik Pesan Balasan;
:Pilih File Lampiran (Opsional);
:Klik "Kirim";
|Sistem|
:Simpan Komentar & Lampiran ke Database;
:Kirim Notifikasi ke Lawan Bicara;
:Segarkan Tampilan Percakapan;
|Pengguna (Supervisor/IT)|
:Melihat Komentar Baru di Timeline;
stop
@enduml
```

---

## 5. Membaca Knowledge Base
*Aktivitas untuk mencari dan membaca tutorial solusi mandiri guna menyelesaikan masalah.*

```plantuml
@startuml activity_membaca_kb
title Activity Diagram - Membaca Knowledge Base
|Pengguna (Supervisor/IT)|
start
:Buka Menu Knowledge Base;
:Masukkan Kata Kunci Masalah;
|Sistem|
:Filter Artikel Relevan di Database;
:Tampilkan Daftar Artikel Terkait;
|Pengguna (Supervisor/IT)|
:Pilih & Klik Judul Artikel;
|Sistem|
:Ambil & Tampilkan Isi Artikel Solusi;
|Pengguna (Supervisor/IT)|
:Membaca Artikel Solusi;
stop
@enduml
```

---

## 6. Menerima Notifikasi
*Aktivitas penerimaan notifikasi real-time saat terjadi aktivitas tiket.*

```plantuml
@startuml activity_menerima_notifikasi
title Activity Diagram - Menerima Notifikasi
|Sistem|
start
:Deteksi Aksi (Tiket Baru/Update Status/Komentar);
:Simpan Notifikasi ke Database;
:Kirim Pesan WhatsApp / Email;
:Perbarui Badge Lonceng Notifikasi di UI;
|Pengguna (Supervisor/IT)|
:Terima Alert WA/Email atau Lihat Badge Lonceng;
:Klik Lonceng Notifikasi / Link Email;
|Sistem|
:Arahkan Pengguna ke Detail Tiket Terkait;
|Pengguna (Supervisor/IT)|
:Melihat Detail Tiket;
stop
@enduml
```

---

## 7. Mengambil Tiket
*Aktivitas penugasan mandiri (Claim Ticket) oleh tim IT Support pada tiket-tiket baru.*

```plantuml
@startuml activity_mengambil_tiket
title Activity Diagram - Mengambil Tiket (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Antrean Tiket Masuk "Unassigned";
:Pilih Tiket Baru;
:Klik Tombol "Ambil Tiket";
|Sistem|
if (Tiket Sudah Diambil?) then (Belum)
  :Set Assignee = Teknisi & Status = IN_PROGRESS;
  :Catat Log Klaim Tiket & Segarkan Antrean;
  |IT Support (MIS)|
  :Melihat Tiket Masuk ke Halaman Tugas Saya;
else (Sudah)
  |Sistem|
  :Tampilkan Pesan Error Tiket Sudah Diambil;
  |IT Support (MIS)|
  :Kembali ke Antrean;
endif
stop
@enduml
```

---

## 8. Melihat Tiket Tugas Saya
*Aktivitas untuk memantau daftar tiket yang sedang ditugaskan kepada teknisi (terurut berdasarkan AHP).*

```plantuml
@startuml activity_melihat_tiket_tugas_saya
title Activity Diagram - Melihat Tiket Tugas Saya (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Menu "Tugas Saya";
|Sistem|
:Reload / Memuat Ulang Data Tiket Tugas Saya;
:Urutkan Daftar Tiket berdasarkan Prioritas AHP;
:Menampilkan Daftar Tiket (Termasuk Badge Status);
|IT Support (MIS)|
:Gunakan Filter Status / Prioritas (Opsional);
|Sistem|
:Saring & Urutkan Daftar Tiket;
:Tampilkan Daftar Tiket Terfilter;
|IT Support (MIS)|
:Melihat Daftar Tiket Tugas Saya & Statusnya;
stop
@enduml
```

---

## 9. Mengubah Status Tiket
*Aktivitas memperbarui status progres pengerjaan tiket oleh teknisi.*

```plantuml
@startuml activity_mengubah_status_tiket
title Activity Diagram - Mengubah Status Tiket (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Detail Tiket di Halaman Tugas Saya;
:Klik Pilihan Status Tiket;
:Pilih Status Baru (Pending / Resolved / Closed);
|Sistem|
:Simpan Status Baru & Tanggal Penyelesaian;
:Catat Perubahan ke Log Riwayat Status;
:Kirim Notifikasi Perubahan Status ke Pelapor;
|IT Support (MIS)|
:Melihat Toast Sukses Perubahan Status;
stop
@enduml
```

---

## 10. Membuat Tutorial
*Aktivitas mempublikasikan solusi penanganan tiket menjadi artikel baru di Knowledge Base.*

```plantuml
@startuml activity_membuat_tutorial
title Activity Diagram - Membuat Tutorial (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Detail Tiket Selesai (Resolved/Closed);
:Klik Tombol "Buat Tutorial / Convert to KB";
:Isi/Edit Form Artikel Solusi;
:Klik "Simpan";
|Sistem|
:Validasi & Simpan Artikel KB Baru;
:Hubungkan ID Artikel KB ke Riwayat Tiket;
|IT Support (MIS)|
:Melihat Artikel Baru Tampil di Knowledge Base;
stop
@enduml
```

---

## 11. Konfigurasi AHP
*Aktivitas untuk memperbarui bobot kriteria AHP untuk perhitungan prioritas otomatis.*

```plantuml
@startuml activity_konfigurasi_ahp
title Activity Diagram - Konfigurasi AHP (IT Support (MIS))
|IT Support (MIS)|
start
:Akses Menu Konfigurasi AHP;
:Ubah Nilai Perbandingan Berpasangan;
:Klik "Hitung Konsistensi";
|Sistem|
:Hitung Bobot AHP & Consistency Ratio (CR);
:Tampilkan Hasil Konsistensi Ratio;
if (Consistency Ratio <= 0.1?) then (Ya)
  |IT Support (MIS)|
  :Klik Simpan Pengaturan;
  |Sistem|
  :Simpan Bobot Kriteria Baru ke Database;
  |IT Support (MIS)|
  :Melihat Konfigurasi AHP Berhasil Disimpan;
else (Tidak)
  |IT Support (MIS)|
  :Sesuaikan Kembali Nilai Perbandingan;
endif
stop
@enduml
```

---

## 12. Mengembalikan Tiket
*Aktivitas mengembalikan tiket yang tidak sanggup dikerjakan kembali ke antrean unassigned atau mengalihkannya.*

```plantuml
@startuml activity_mengembalikan_tiket
title Activity Diagram - Mengembalikan Tiket (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Detail Tiket Tugas Saya;
:Klik Dropdown Penerima Tugas (Assignee);
:Pilih "Unassigned" atau Teknisi Lain;
:Klik Konfirmasi Pengalihan;
|Sistem|
:Ubah Assignee = Null / Teknisi Baru;
if (Apakah Assignee Null?) then (Ya)
  :Ubah Status Tiket = OPEN;
else (Tidak)
  :Tetapkan Status = IN_PROGRESS;
endif
:Catat Pengalihan Tiket di Riwayat Log;
:Kirim Notifikasi ke Penanggung Jawab Baru;
|IT Support (MIS)|
:Melihat Tiket Keluar dari Halaman Tugas Saya;
stop
@enduml
```

---

## 13. Melihat Laporan Analitik
*Aktivitas menganalisis kinerja operasional TI, rata-rata resolusi SLA, dan ekspor laporan.*

```plantuml
@startuml activity_melihat_laporan_analitik
title Activity Diagram - Melihat Laporan Analitik (IT Support (MIS))
|IT Support (MIS)|
start
:Buka Menu Laporan Analitik;
:Pilih Filter Periode / Departemen (Opsional);
|Sistem|
:Query Data Agregasi SLA, AHP, & KPI;
:Tampilkan Grafik & Statistik di UI;
|IT Support (MIS)|
:Membaca Grafik SLA, KPI Agen, & Tren Kategori;
:Klik "Cetak / Ekspor PDF" (Opsional);
|Sistem|
:Konversi Halaman Grafik menjadi Berkas PDF;
|IT Support (MIS)|
:Menyimpan Berkas PDF Laporan Kinerja;
stop
@enduml
```

---

## 14. Manajemen User
*Aktivitas pengelolaan akun pengguna sistem (tambah/edit/hapus/reset password).*

```plantuml
@startuml activity_manajemen_user
title Activity Diagram - Manajemen User (IT Support (MIS))
|IT Support (MIS)|
start
:Akses Menu Manajemen User;
switch (Aksi)
case (Tambah)
  :Isi Form User Baru: NIK, Nama, Email, Role, Dept;
  :Klik Simpan;
  |Sistem|
  if (Validasi User?) then (Valid)
    :Simpan Akun ke Database;
  else (Tidak)
    :Tampilkan Alert Kesalahan Input;
  endif
case (Edit)
  |IT Support (MIS)|
  :Ubah Data User / Klik Reset Sandi;
  :Klik Simpan;
  |Sistem|
  :Update Data User ke Database;
case (Hapus)
  |IT Support (MIS)|
  :Klik Nonaktifkan User;
  :Konfirmasi Penonaktifan;
  |Sistem|
  :Update Akun Menjadi Nonaktif;
endswitch
|IT Support (MIS)|
:Melihat Toast Sukses Perubahan User;
stop
@enduml
```
