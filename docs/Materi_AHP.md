# Alur Lengkap AHP: Dari Konfigurasi hingga Penanganan Tiket

Penerapan AHP (Analytic Hierarchy Process) pada sistem IT Ticketing Support ini terbagi menjadi dua fase besar: **Fase Administratif** (menentukan bobot kriteria menggunakan matriks AHP) dan **Fase Transaksional** (menghitung prioritas tiket baru berdasarkan input pengguna dan bobot AHP).

---

## FASE 1: Penentuan Bobot Kriteria AHP (Fase Administratif)

Sebelum sistem bisa menilai tiket, kita harus menentukan tingkat kepentingan di antara 5 kriteria yang ada: **Urgensi, Dampak, Risiko, Cakupan,** dan **Kompleksitas**. Penilaian ini menggunakan skala Saaty (1-9).

### 1. Membuat Matriks Perbandingan Berpasangan
Admin atau Peneliti membandingkan tingkat kepentingan antar kriteria. Misalnya: "Urgensi" dinilai sedikit lebih penting (skala 3) dibandingkan "Dampak", dan mutlak lebih penting (skala 9) dibandingkan "Kompleksitas".

Berikut adalah simulasi matriks perbandingannya:

| Kriteria | Urgensi | Dampak | Risiko | Cakupan | Kompleksitas |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Urgensi** | 1 | 2 | 3 | 5 | 7 |
| **Dampak** | 1/2 (0.5) | 1 | 2 | 4 | 5 |
| **Risiko** | 1/3 (0.33) | 1/2 (0.5) | 1 | 3 | 4 |
| **Cakupan** | 1/5 (0.2) | 1/4 (0.25) | 1/3 (0.33) | 1 | 2 |
| **Kompleksitas** | 1/7 (0.14) | 1/5 (0.2) | 1/4 (0.25)| 1/2 (0.5)| 1 |
| **TOTAL KOLOM** | **2.17** | **3.95** | **6.58** | **13.5** | **19** |

### 2. Normalisasi Matriks & Menghitung Bobot (Eigenvector)
Setiap nilai pada sel dibagi dengan total kolomnya. Kemudian, dicari rata-rata per baris untuk mendapatkan **Bobot Akhir (Eigenvector)**.

| Kriteria | Normalisasi Baris (Rata-rata) | Bobot Akhir | Persentase |
| :--- | :--- | :--- | :--- |
| **Urgensi** | (1/2.17 + 2/3.95 + ... ) / 5 | **0.400** | **40%** |
| **Dampak** | (0.5/2.17 + 1/3.95 + ... ) / 5 | **0.260** | **26%** |
| **Risiko** | (0.33/2.17 + 0.5/3.95 + ... ) / 5 | **0.170** | **17%** |
| **Cakupan** | (0.2/2.17 + 0.25/3.95 + ... ) / 5 | **0.100** | **10%** |
| **Kompleksitas** | (0.14/2.17 + 0.2/3.95 + ... ) / 5 | **0.070** | **7%** |
| **TOTAL** | | **1.000** | **100%** |

*(Catatan Sistem: Sistem akan secara otomatis menghitung nilai **Consistency Ratio (CR)**. Jika CR <= 0.1, maka pembobotan ini dianggap logis dan disimpan ke database. Bobot inilah yang menjadi acuan penilaian).*

---

## FASE 2: Studi Kasus Pembuatan Tiket (Fase Transaksional)

### Skenario Kasus:
Supervisor Toko (User) mengalami kendala: **"Aplikasi POS Kasir Error, tidak bisa transaksi dan pelanggan antre panjang."**

### Langkah 1: User Membuat Tiket
User login dan menekan tombol *Create Ticket*. Selain mengisi judul dan deskripsi, sistem meminta User memberikan penilaian mandiri (Skala 1 - 5) terkait kondisi di lapangan:

1. **Urgensi (Mendesak):** User memilih **5 (Sangat Tinggi)** karena operasional toko terhenti.
2. **Dampak:** User memilih **5 (Sangat Tinggi)** karena transaksi finansial gagal.
3. **Risiko:** User memilih **4 (Tinggi)** karena berisiko kehilangan pendapatan.
4. **Cakupan:** User memilih **2 (Rendah)** karena hanya 1 toko yang terdampak.
5. **Kompleksitas:** User memilih **3 (Sedang)** karena tidak tahu penyebabnya.

### Langkah 2: Proses Kalkulasi di Backend (API)
Begitu tombol submit ditekan, API Route menjalankan algoritma AHP.

`Skor Total = Σ (Bobot Kriteria AHP × Input User)`

* Urgensi: `0.40 × 5 = 2.00`
* Dampak: `0.26 × 5 = 1.30`
* Risiko: `0.17 × 4 = 0.68`
* Cakupan: `0.10 × 2 = 0.20`
* Kompleksitas: `0.07 × 3 = 0.21`

**Skor Akhir AHP = 2.00 + 1.30 + 0.68 + 0.20 + 0.21 = 4.39**

### Langkah 3: Penentuan Tingkat Prioritas (Threshold)
Sistem memiliki pengkondisian batas (*threshold*) dari skor AHP maksimal (5.0):
* `Skor >= 3.8` -> **CRITICAL**
* `Skor >= 2.8` -> **HIGH**
* `Skor >= 1.5` -> **MEDIUM**
* `Skor < 1.5` -> **LOW**

Karena skor akhir adalah **4.39**, tiket secara otomatis diklasifikasikan sebagai **CRITICAL**.

> **Fitur Logika Failsafe (Override):**
> Jika perhitungan skor AHP jatuh di angka prioritas LOW atau MEDIUM, tetapi ada satu kriteria krusial yang dinilai 5 (Sangat Tinggi) oleh User, sistem akan meng-override (memaksa) prioritas tiket naik menjadi minimal HIGH. Ini mencegah isu yang memiliki satu dampak fatal terabaikan.

---

## FASE 3: Penerimaan & Penanganan oleh IT Support

1. **Notifikasi Real-time:** Sistem mengeksekusi integrasi *WhatsAppService* dan *EmailService*. Teknisi IT menerima pesan: *"Tiket Baru #TKT-001 (CRITICAL): Aplikasi POS Kasir Error"*.
2. **Tampil di Dashboard IT Support:** Saat IT Support membuka dashboard, daftar tiket akan disajikan. Sistem mengurutkan tiket berdasarkan tingkat prioritas (`ORDER BY priority DESC`). Tiket **CRITICAL** (Skor 4.39) otomatis berada di baris teratas, di atas tiket keluhan biasa (LOW).
3. **Proses Penanganan (Assignment):** IT Support mengklik tiket tersebut dan menekan tombol **"Assign to Me"**. Status berubah dari `OPEN` menjadi `IN_PROGRESS`. Supervisor Shop otomatis mendapat notifikasi email.
4. **Penyelesaian (Resolution):** Setelah perbaikan, IT Support mengubah status menjadi `RESOLVED`. Solusi dicatat, dan dapat ditambahkan ke dalam **Knowledge Base** sebagai referensi masa depan.
