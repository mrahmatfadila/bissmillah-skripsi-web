# Panduan Alur Activity Diagram (Format Simpel)
**Gunakan panduan ini untuk menggambar di Draw.io.**

Setiap diagram dibagi menjadi dua kolom (Swimlanes): 
1. **Kiri:** Aktor (User/Admin/Teknisi)
2. **Kanan:** Sistem

---

## 1. Modul Akses & Keamanan

### A. Activity Diagram: Logout
*Flow: User ingin keluar dari aplikasi.*
1. **[Mulai]** (di sisi User)
2. **User:** Klik menu "Keluar" (Logout).
3. **Sistem:** Menghapus sesi login (Session Destroy).
4. **Sistem:** Redirect ke Halaman Login.
5. **[Selesai]**

---

## 2. Modul Pembuatan Tiket (Core)

### B. Activity Diagram: Create Ticket (Standar/Manual)
*Flow: User membuat tiket biasa.*
1. **[Mulai]** (di sisi User)
2. **User:** Klik menu "Buat Tiket".
3. **Sistem:** Menampilkan Form Tiket.
4. **User:** Mengisi Judul, Deskripsi, Kategori.
5. **User:** Memilih Prioritas Manual (Low/Medium/High).
6. **User:** Klik tombol "Submit".
7. **Sistem:** (Decision) Cek kelengkapan data?
   - *Jika Kosong:* Tampilkan pesan error (Kembali ke no. 4).
   - *Jika Lengkap:* Simpan data tiket (Status: OPEN).
8. **Sistem:** Tampilkan notifikasi "Sukses" & Redirect ke menu Tiket Saya.
9. **[Selesai]**

### C. Activity Diagram: Create Ticket dengan AHP (Sesuai Sistem Aktual)
*Flow: User input skor, sistem otomatis hitung prioritas saat simpan.*
1. **[Mulai]** (di sisi User)
2. **User:** Klik tombol "Buat Tiket".
3. **Sistem:** Menampilkan Form Tiket + Slider Kriteria (Input 1-5).
4. **User:** Mengisi Judul, Deskripsi & Menggeser Slider sesuai penilaian.
5. **User:** Klik tombol "Kirim Tiket".
6. **Sistem:** (Proses Backend) Menghitung bobot AHP & Total Skor.
7.  **Sistem:** (Proses Backend) Menentukan Prioritas (Low/Med/High) berdasarkan skor.
8. **Sistem:** Menyimpan tiket hasilnya ke database.
9. **Sistem:** Kirim notifikasi WA ke Admin & Redirect User.
10. **[Selesai]**

---

## 3. Modul Manajemen Tiket (User)

### D. Activity Diagram: Tracking Status & History
1. **[Mulai]**
2. **User:** Klik detail salah satu tiket.
3. **Sistem:** Menampilkan Halaman Detail Tiket.
4. **Sistem:** Menampilkan Label Status Terkini (Badge) di bagian Header Judul.
5. **User:** (Opsional) Klik Tab "Diskusi & Chat".
6. **Sistem:** Menampilkan riwayat log aktivitas dan percakapan.
7. **[Selesai]**

### E. Activity Diagram: Komentar & Balasan
1. **[Mulai]**
2. **User/Admin:** Mengetik pesan chat di detail tiket.
3. **User/Admin:** Klik "Kirim".
4. **Sistem:** Simpan pesan ke database.
5. **Sistem:** Tampilkan pesan di layar chat.
6. **Sistem:** Kirim notifikasi ke lawan bicara.
7. **[Selesai]**

### F. Activity Diagram: Upload Bukti
1. **[Mulai]**
2. **User:** Klik tombol "Upload Gambar".
3. **User:** Memilih file dari komputer.
4. **Sistem:** (Decision) Cek format & ukuran file?
   - *Salah:* Tolak dan munculkan error.
   - *Benar:* Upload file ke server penyimpanan.
5. **Sistem:** Tampilkan preview gambar di tiket.
6. **[Selesai]**

---

## 4. Modul Operasional IT Support

### G. Activity Diagram: Claim Tiket (Self-Assignment)
*Flow: Teknisi mengambil tiket baru.*
1. **[Mulai]** (di sisi Teknisi)
2. **Teknisi:** Buka menu "Tiket Belum Ditugaskan".
3. **Teknisi:** Pilih tiket & Klik "Ambil".
4. **Sistem:** Update database: Ubah Assignee ke Teknisi tersebut.
5. **Sistem:** Ubah Status menjadi "In Progress" (Diproses).
6. **Sistem:** Pindahkan tiket ke menu "Tugas Saya".
7. **[Selesai]**

### H. Activity Diagram: Update Progress
1. **[Mulai]**
2. **Teknisi:** Buka tiket yang sedang dikerjakan.
3. **Teknisi:** Klik "Update Status".
4. **Teknisi:** Pilih status baru (misal: Resolved) & isi catatan solusi.
5. **Sistem:** Simpan perubahan status.
6. **Sistem:** Catat waktu penyelesaian.
7. **Sistem:** Notifikasi ke User bahwa tiket sudah selesai.
8. **[Selesai]**

### I. Activity Diagram: Notifikasi WA & Respon Tiket
1. **[Mulai]** (Trigger: Tiket Baru dibuat dengan status apapun)
2. **Sistem:** Mendeteksi tiket baru masuk di database.
3. **Sistem:** Mengirim Notifikasi WhatsApp ke Admin/Teknisi.
4. **Teknisi:** Menerima pesan WA (Berisi Judul, Prioritas, & Pelapor).
5. **Teknisi:** (Decision) Cek Prioritas tiket?
   - *Jika Critical/High:* **Segera** Login & Ambil Tiket (Urgent).
   - *Jika Low/Medium:* Masuk antrian pengerjaan normal.
6. **[Selesai]**

---

## 5. Modul Manajemen (Manager)

### J. Activity Diagram: Assignment Tiket (Pendelegasian)
1. **[Mulai]** (di sisi Manager)
2. **Manager:** Buka tiket yang belum ada teknisi.
3. **Manager:** Pilih nama Teknisi di dropdown "Penerima Tugas".
4. **Sistem:** Menyimpan data Assignee secara otomatis.
5. **Sistem:** Kirim notifikasi ke teknisi yang dipilih.
6. **[Selesai]**

### K. Activity Diagram: Validasi & Closing
1. **[Mulai]**
2. **Manager:** Cek tiket status "Resolved".
3. **Manager:** Periksa hasil kerja teknisi.
4. **Manager:** (Decision) Apakah sudah valid?
   - *Belum:* Kembalikan status ke "In Progress" (Re-open).
   - *Sudah:* Ubah status ke "Closed" (Final).
5. **Sistem:** Simpan status akhir.
6. **[Selesai]**

### L. Activity Diagram: Monitoring Dashboard
1. **[Mulai]**
2. **Admin:** Buka halaman Dashboard.
3. **Sistem:** Mengambil data statistik (Jumlah tiket, performa teknisi).
4. **Sistem:** Kalkulasi persentase dan grafik.
5. **Sistem:** Tampilkan widget grafik (Pie Chart/Bar Chart).
6. **[Selesai]**

---

## 6. Modul Manajemen Data Sampah (Trash)

### M. Activity Diagram: Pembatalan Tiket (Soft Delete)
1. **[Mulai]**
2. **User/Admin:** Buka halaman detail tiket.
3. **User/Admin:** Pilih opsi "Dibatalkan" (Cancelled) pada dropdown status.
4. **Sistem:** Memvalidasi hak akses user (Manager/Admin).
5. **Sistem:** Update status tiket menjadi "CANCELLED" (Soft Delete).
6. **Sistem:** Memindahkan tiket ke menu "Spam" (Hilang dari list aktif).
7. **Sistem:** Menampilkan notifikasi "Status berhasil diperbarui".
8. **[Selesai]**

### N. Activity Diagram: Restore (Kembalikan Data)
1. **[Mulai]**
2. **Admin:** Buka menu "Spam".
3. **Admin:** Pilih tiket & Klik tombol "Pulihkan".
4. **Sistem:** Set is_deleted = False.
5. **Sistem:** Kembalikan tiket ke list aktif semula.
6. **[Selesai]**

### O. Activity Diagram: Hapus Permanen (Hard Delete)
1. **[Mulai]**
2. **Admin:** Buka menu "Spam".
3. **Admin:** Pilih tiket & Klik tombol "Hapus".
4. **Sistem:** Konfirmasi "Data akan hilang selamanya?".
5. **Admin:** Klik "Ya".
6. **Sistem:** Hapus data dari database sepenuhnya.
7. **[Selesai]**

---

## 7. Modul Knowledge Base (KB)

### P. Activity Diagram: Membuat Artikel Solusi
1. **[Mulai]**
2. **Admin:** Klik tombol "Buat Artikel Baru".
3. **Admin:** Isi Judul, Pilih Kategori, dan Tulis Konten.
4. **Admin:** Klik tombol "Terbitkan Artikel".
5. **Sistem:** Simpan artikel ke Database.
6. **[Selesai]**

### Q. Activity Diagram: Pencarian Solusi Mandiri
1. **[Mulai]**
2. **User:** Ketik kata kunci masalah di kolom search.
3. **Sistem:** Cari artikel yang relevan di database.
4. **Sistem:** Tampilkan daftar solusi.
5. **User:** Membaca artikel.
6. **User:** (Decision) Apakah masalah selesai?
   - *Ya:* User tidak jadi buat tiket.
   - *Tidak:* User lanjut klik "Buat Tiket".
7. **[Selesai]**

---

## 8. Modul Administrasi (Super Admin)

### R. Activity Diagram: Kelola User
1. **[Mulai]**
2. **Admin:** Buka menu "Manajemen User".
3. **Admin:** Input data user baru (Username, Password, Role).
4. **Admin:** Klik "Simpan".
5. **Sistem:** Validasi duplikasi username.
6. **Sistem:** Enkripsi password & Simpan user baru.
7. **[Selesai]**

### S. Activity Diagram: Konfigurasi Kriteria AHP
1. **[Mulai]**
2. **Admin:** Buka menu "Pengaturan AHP".
3. **Admin:** Input nilai perbandingan pada Matriks.
4. **Admin:** Klik tombol "Kalkulasi Bobot".
5. **Sistem:** Menghitung Bobot & Rasio Konsistensi (CR).
6. **Admin:** Klik tombol "Simpan Konfigurasi".
7. **Sistem:** Simpan data bobot ke database.
8. **[Selesai]**

---

## 9. Modul Notifikasi

### T. Activity Diagram: Notifikasi WhatsApp
1. **[Mulai]** (Trigger: Tiket Baru Tersimpan)
2. **Sistem:** Generate format pesan (No Tiket, Pelapor, Judul, Prioritas).
3. **Sistem:** Cek & Sertakan lampiran gambar (jika tersedia).
4. **Sistem:** Kirim HTTP Request ke API WhatsApp Gateway (Fonnte).
5. **WA Gateway:** Memproses pesan & meneruskan ke nomor Admin/Grup.
6. **Admin:** Menerima notifikasi real-time di WhatsApp.
7. **[Selesai]**
