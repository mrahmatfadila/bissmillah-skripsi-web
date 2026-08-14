# Dokumen Materi AHP Lengkap Untuk Sidang Skripsi

**Judul Skripsi Pendukung**: *"Penerapan Metode Analytic Hierarchy Process (AHP) Pada Sistem IT Ticketing Support Untuk Penentuan Prioritas Penanganan Gangguan (Studi Kasus: PT Plaza Bali)"*

Dokumen ini memuat materi penjelasan matematis dan alur sistematis penerapan metode **Analytic Hierarchy Process (AHP)** pada aplikasi Anda. Materi ini disusun secara lengkap dan mendalam (mulai dari pengisian matriks Saaty oleh IT Support/Admin hingga kalkulasi prioritas otomatis saat Supervisor Shop membuat tiket) untuk membantu Anda menjawab pertanyaan dosen penguji secara meyakinkan.

---

## 1. PENDAHULUAN: Mengapa Menggunakan AHP?

Dalam sistem operasional IT Support PT Plaza Bali, kendala yang dilaporkan oleh berbagai unit kerja/toko seringkali menumpuk. Tanpa metode prioritas yang jelas, staf IT akan kebingungan mendahulukan tiket mana yang kritis, sehingga mengganggu kelancaran bisnis.

Metode **AHP (Analytic Hierarchy Process)** memecahkan masalah multi-kriteria ini dengan cara:
1. **Fase Konfigurasi (Administratif)**: IT Support/Admin membandingkan tingkat kepentingan dari 5 kriteria utama gangguan menggunakan **Skala 1-9 Saaty** untuk mencari nilai bobot kriteria secara objektif melalui uji konsistensi.
2. **Fase Transaksional**: Supervisor Shop mengisi kuesioner slider (skala 1-5) mengenai kondisi gangguan yang dialami. Sistem secara otomatis menghitung skor prioritas akhir berbasis bobot kriteria AHP yang sudah sah di database.

---

## 2. 5 KRITERIA GANGGUAN IT YANG DIGUNAKAN

Sistem ini membagi penilaian tingkat keparahan keluhan ke dalam **5 kriteria** berikut:
1. **Cakupan (Scope)**: Seberapa luas wilayah yang terdampak oleh gangguan (contoh: hanya 1 PC kasir, 1 toko, atau seluruh area jaringan toko).
2. **Dampak (Impact)**: Tingkat kerusakan fungsional sistem (contoh: transaksi terhenti total, atau hanya tampilan layout layar).
3. **Kompleksitas (Complexity)**: Tingkat kesulitan teknis dalam penyelesaian masalah.
4. **Risiko (Risk)**: Potensi kerugian finansial atau keamanan data yang disebabkan jika masalah dibiarkan.
5. **Urgensi (Urgency)**: Tingkat kedaruratan waktu di mana masalah harus segera diselesaikan (misalnya karena antrean pelanggan memanjang).

---

## 3. FASE 1: PENENTUAN BOBOT KRITERIA OLEH IT SUPPORT / ADMIN

### Langkah 1.1: Pembuatan Matriks Perbandingan Berpasangan (Pairwise Comparison)
Admin/IT Support membandingkan tingkat kepentingan antar kriteria satu sama lain menggunakan **Skala Saaty**:
*   **1**: Kedua elemen sama penting.
*   **3**: Elemen yang satu sedikit lebih penting daripada elemen lainnya.
*   **5**: Elemen yang satu jelas lebih penting daripada elemen lainnya.
*   **7**: Elemen yang satu sangat jelas lebih penting daripada elemen lainnya.
*   **9**: Elemen yang satu mutlak lebih penting daripada elemen lainnya.
*   *Angka 2, 4, 6, 8 adalah nilai-nilai antara di antaranya.*

Misalkan hasil penilaian perbandingan berpasangan oleh IT Support adalah sebagai berikut:
1. **Risiko** dinilai sedikit lebih penting (Skala 3) dibanding **Cakupan**.
2. **Risiko** dinilai sedikit lebih penting (Skala 2) dibanding **Urgensi**.
3. **Urgensi** dinilai sedikit lebih penting (Skala 2) dibanding **Dampak**.
4. **Dampak** dinilai sedikit lebih penting (Skala 2) dibanding **Kompleksitas**.

Dari penilaian tersebut, terbentuk **Matriks Perbandingan Berpasangan** di bawah ini:

| Kriteria | Cakupan | Dampak | Kompleksitas | Risiko | Urgensi |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Cakupan** | 1.0000 | 2.0000 | 1.5000 | 0.3333 | 0.5000 |
| **Dampak** | 0.5000 | 1.0000 | 2.0000 | 0.2500 | 0.5000 |
| **Kompleksitas** | 0.6667 | 0.5000 | 1.0000 | 0.2000 | 0.3333 |
| **Risiko** | 3.0000 | 4.0000 | 5.0000 | 1.0000 | 2.0000 |
| **Urgensi** | 2.0000 | 2.0000 | 3.0000 | 0.5000 | 1.0000 |
| **TOTAL KOLOM** | **7.1667** | **9.5000** | **12.5000** | **2.2833** | **4.3333** |

*(Catatan: Nilai di bawah diagonal utama matriks adalah kebalikan/resiprokal dari nilai di atas diagonal utama. Contoh: jika Cakupan vs Risiko = 1/3 (0.3333), maka Risiko vs Cakupan = 3).*

---

### Langkah 1.2: Normalisasi Matriks & Menghitung Bobot Kriteria (Eigenvector)
Untuk mendapatkan bobot akhir (Eigenvector), setiap nilai sel pada kolom dibagi dengan total kolom tempat sel tersebut berada, kemudian baris hasil pembagian tersebut dirata-rata.

**Rumus Normalisasi:**
$$s_{ij} = \frac{a_{ij}}{\sum_{k=1}^{n} a_{kj}}$$

**Rumus Bobot Akhir (Eigenvector):**
$$w_i = \frac{\sum_{j=1}^{n} s_{ij}}{n}$$

**Hasil Perhitungan Normalisasi dan Bobot Akhir (Eigenvector):**

*   **Cakupan (Row 1):**
    *   Normalisasi: $\frac{1}{7.1667} + \frac{2}{9.5} + \frac{1.5}{12.5} + \frac{0.3333}{2.2833} + \frac{0.5}{4.3333} \approx 0.1395 + 0.2105 + 0.1200 + 0.1460 + 0.1154 = 0.7314$
    *   Bobot Akhir ($w_1$): $0.7314 / 5 \approx$ **`0.1755`** (**17.6%**)

*   **Dampak (Row 2):**
    *   Normalisasi: $\frac{0.5}{7.1667} + \frac{1}{9.5} + \frac{2}{12.5} + \frac{0.25}{2.2833} + \frac{0.5}{4.3333} \approx 0.0698 + 0.1053 + 0.1600 + 0.1095 + 0.1154 = 0.5600$
    *   Bobot Akhir ($w_2$): $0.5600 / 5 \approx$ **`0.0893`** (**8.9%**)

*   **Kompleksitas (Row 3):**
    *   Normalisasi: $\frac{0.6667}{7.1667} + \frac{0.5}{9.5} + \frac{1}{12.5} + \frac{0.2}{2.2833} + \frac{0.3333}{4.3333} \approx 0.0930 + 0.0526 + 0.0800 + 0.0876 + 0.0769 = 0.3901$
    *   Bobot Akhir ($w_3$): $0.3901 / 5 \approx$ **`0.1194`** (**11.9%**)

*   **Risiko (Row 4):**
    *   Normalisasi: $\frac{3}{7.1667} + \frac{4}{9.5} + \frac{5}{12.5} + \frac{1}{2.2833} + \frac{2}{4.3333} \approx 0.4186 + 0.4211 + 0.4000 + 0.4379 + 0.4615 = 2.1391$
    *   Bobot Akhir ($w_4$): $2.1391 / 5 \approx$ **`0.3978`** (**39.8%**)

*   **Urgensi (Row 5):**
    *   Normalisasi: $\frac{2}{7.1667} + \frac{2}{9.5} + \frac{3}{12.5} + \frac{0.5}{2.2833} + \frac{1}{4.3333} \approx 0.2791 + 0.2105 + 0.2400 + 0.2190 + 0.2308 = 1.1794$
    *   Bobot Akhir ($w_5$): $1.1794 / 5 \approx$ **`0.2179`** (**21.8%**)

**Total Bobot Kriteria = 0.1755 + 0.0893 + 0.1194 + 0.3978 + 0.2179 = 1.0000 (100%)**

---

### Langkah 1.3: Uji Konsistensi (Consistency Test)
Untuk memastikan perbandingan berpasangan yang dibuat oleh IT Support bersifat logis/konsisten, sistem menghitung nilai **Consistency Ratio (CR)**.

#### A. Menghitung $\lambda_{max}$ (Eigenvalue Maksimal)
Kalikan jumlah total kolom matriks perbandingan awal dengan bobot kriteria (Eigenvector) masing-masing, lalu jumlahkan hasilnya.

$$\lambda_{max} = \sum_{j=1}^{n} (\text{Total Kolom}_j \times w_j)$$

$$\lambda_{max} = (7.1667 \times 0.1755) + (9.5000 \times 0.0893) + (12.5000 \times 0.1194) + (2.2833 \times 0.3978) + (4.3333 \times 0.2179)$$
$$\lambda_{max} = 1.2581 + 0.8484 + 1.4931 + 0.9083 + 0.9443 = 5.4522$$

#### B. Menghitung Consistency Index (CI)
$$CI = \frac{\lambda_{max} - n}{n - 1} = \frac{5.4522 - 5}{5 - 1} = \frac{0.4522}{4} = 0.1130$$

#### C. Menghitung Consistency Ratio (CR)
Berdasarkan tabel nilai **Index Random Konsistensi (RI)** Saaty untuk jumlah kriteria $n = 5$ adalah **`1.12`**:

| $n$ (Kriteria) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **RI** | 0.00 | 0.00 | 0.58 | 0.90 | **1.12** | 1.24 | 1.32 | 1.41 | 1.45 |

$$CR = \frac{CI}{RI} = \frac{0.1130}{1.12} = 0.1009 \approx \mathbf{0.100}$$

**Kesimpulan Uji Konsistensi:**
Nilai $CR \le 0.10$ merupakan batas toleransi konsistensi. Karena hasil perhitungan $CR = 0.10$ (memenuhi batas $\le 0.1$), maka penilaian matriks perbandingan dianggap **Konsisten (Valid)**. Sistem akan mengizinkan penyimpanan konfigurasi ini ke tabel database `AHPCriteria`.

---

## 4. FASE 2: GANGGUAN DILAPORKAN & USER (SPV SHOP) MENGISI SLIDER

### Studi Kasus Gangguan Toko:
Supervisor Toko (User) di Plaza Bali mengalami kendala: **"Aplikasi POS Kasir Utama mati total saat antrean kasir menumpuk."**

Ketika membuat tiket baru di aplikasi, Supervisor Toko memberikan nilai kuesioner slider (skala 1 s.d 5) sebagai representasi kondisi di lapangan:
1.  **Cakupan (Scope)**: Diberi nilai **`3`** (Satu unit toko Plaza Bali terhenti operasionalnya).
2.  **Dampak (Impact)**: Diberi nilai **`5`** (Sangat Tinggi, transaksi penjualan mati total).
3.  **Kompleksitas (Complexity)**: Diberi nilai **`2`** (Rendah, estimasi hanya masalah kelistrikan atau aplikasi).
4.  **Risiko (Risk)**: Diberi nilai **`5`** (Sangat Tinggi, risiko kehilangan pendapatan dan komplain pelanggan).
5.  **Urgensi (Urgency)**: Diberi nilai **`5`** (Sangat Tinggi, pelanggan mengantre panjang di kasir).

---

## 5. FASE 3: PERHITUNGAN AKHIR DI BACKEND & PENENTUAN PRIORITAS

Begitu Supervisor Shop mengklik tombol **"Kirim Tiket"**, Backend API (Next.js) mengeksekusi perhitungan rumus AHP secara otomatis:

### Langkah 3.1: Perkalian Input User dengan Bobot Kriteria AHP
$$\text{Skor AHP} = \sum (\text{Nilai Input Kriteria}_i \times \text{Bobot Kriteria AHP}_i)$$

*   **Cakupan**: $3 \times 0.1755 = 0.5265$
*   **Dampak**: $5 \times 0.0893 = 0.4465$
*   **Kompleksitas**: $2 \times 0.1194 = 0.2388$
*   **Risiko**: $5 \times 0.3978 = 1.9890$
*   **Urgensi**: $5 \times 0.2179 = 1.0895$

$$\text{Skor Akhir AHP} = 0.5265 + 0.4465 + 0.2388 + 1.9890 + 1.0895 = \mathbf{4.2903}$$

---

### Langkah 3.2: Penentuan Kelompok Prioritas (Threshold)
Sistem mengelompokkan hasil nilai akhir AHP (skala maksimal 5.0) ke dalam 4 tingkatan prioritas:
*   `Skor >= 3.8` $\rightarrow$ **`CRITICAL`**
*   `Skor >= 2.8` $\rightarrow$ **`HIGH`**
*   `Skor >= 1.5` $\rightarrow$ **`MEDIUM`**
*   `Skor < 1.5` $\rightarrow$ **`LOW`**

Karena skor akhir perhitungan adalah **`4.29`**, tiket keluhan tersebut diklasifikasikan secara otomatis oleh sistem dengan prioritas **`CRITICAL`**.

---

### Langkah 3.3: Integrasi Notifikasi & Urutan Antrean
1.  **Notifikasi Otomatis**: Sistem langsung mengirim pesan notifikasi WhatsApp dan email ke staf IT Support yang berbunyi: *"Tiket Baru #TCK-202606-005 (CRITICAL) - Aplikasi POS Kasir Utama mati total"*.
2.  **Dashboard Terurut**: Di dashboard penanganan tugas IT Support, tiket berskor **4.29 (Critical)** ini akan otomatis melompat berada di urutan paling atas karena sistem memproses kueri dengan pengurutan prioritas tertinggi:
    ```sql
    SELECT * FROM public."Ticket"
    ORDER BY priority DESC, "ahpScore" DESC;
    ```
    Hal ini menjamin tim IT Support dapat langsung mendahulukan penanganan masalah POS kasir ini daripada tugas-tugas ringan lainnya (seperti instalasi printer non-kasir yang berskor prioritas LOW).
