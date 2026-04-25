# Panduan Lengkap: Cara Kerja AHP (Analytical Hierarchy Process) pada Sistem IT Ticketing

Sistem IT Ticketing Support ini menggunakan algoritma **AHP (Analytical Hierarchy Process)** sebagai basis kecerdasan buatan (Calculation Engine) untuk secara otomatis menentukan tingkat prioritas (Priority) dari suatu tiket atau permasalahan operasional. 

Dokumen ini akan menjelaskan secara rinci bagaimana AHP diimplementasikan dalam sistem.

---

## 1. Konsep Dasar AHP dalam Sistem
AHP adalah sebuah metode pengambilan keputusan terstruktur yang diciptakan oleh Thomas L. Saaty. AHP berfungsi dengan memecah permasalahan kompleks menjadi sebuah struktur hierarki sederhana yang terdiri dari kriteria-kriteria penilaian, kemudian membandingkan setiap kriteria untuk mendapatkan "bobot prioritas" yang objektif.

Dalam konteks IT Ticketing, masalahnya adalah **"Bagaimana menentukan prioritas dari sebuah kendala teknis agar IT Support tahu mana yang harus ditangani lebih dulu?"**

Sistem mengaturnya melalui dua fase:
1. **Fase Konfigurasi (oleh IT Support / Admin):** Menentukan bobot dari masing-masing kriteria.
2. **Fase Eksekusi (saat membuat tiket):** Sistem menilai skor tiket berdasarkan input dan bobot yang telah ditentukan.

---

## 2. Kriteria Penilaian AHP
Sistem memiliki 5 kriteria dasar (yang bisa dikustomisasi) untuk menimbang seberapa kritis sebuah tiket:

1. **Urgensi:** Seberapa mendesak masalah ini perlu diselesaikan agar operasional tidak terhenti?
2. **Dampak:** Seberapa besar efek finansial/operasional yang langsung terasa akibat masalah ini?
3. **Kompleksitas:** Apakah kendala ini sangat sulit/butuh waktu lama untuk diselesaikan secara teknis? 
4. **Cakupan:** Seberapa banyak user, departemen, atau toko cabang yang ikut terdampak dari masalah ini?
5. **Risiko:** Jika tidak segera ditangani, seberapa besar potensi bahaya tambahan yang dapat ditimbulkan (seperti celah keamanan atau kehilangan data)?

---

## 3. Langkah-Langkah Perhitungan dan Pemetaan Prioritas

### A. Pembobotan Kriteria (Matriks Perbandingan Berpasangan)
Di menu **Dashboard > Settings > Konfigurasi AHP**, Super Admin/IT Support akan membandingkan setiap pasangan kriteria menggunakan rasio intensitas (Skala Saaty 1 hingga 9).

- **1:** Sama Penting
- **3:** Sedikit Lebih Penting
- **5:** Lebih Penting
- **7:** Sangat Penting
- **9:** Mutlak Paling Penting

Sistem menyusun matriks komparasi berukuran *n x n* (contoh: 5x5). Skor matriks tersebut kemudian dinormalisasi untuk mencari *Eigen Vector*, yang berfungsi sebagai nilai desimal penyumbang pembobotan total (di mana penjumlahan seluruh bobot bernilai 1.0 atau 100%).

Sistem juga menghitung **Consistency Ratio (CR)**. Jika CR > 0.1, maka penilaian dianggap subjektif dan asal-asalan, sehingga IT Support akan diminta untuk merevisi perbandingan tersebut sebelum menyimpannya.

### B. Input Nilai Tiket (Ticket Scoring)
Ketika Anda atau Supervisor Shop mengajukan keluhan tiket baru, akan ada tahap penilaian skala dampak dan urgensi.

Setiap kriteria yang ada di sistem akan diberikan "Skor Realita / Penilaian Lapangan" dalam rentang nilai **1 sampai 5**.
- **1:** Sangat Rendah
- **5:** Sangat Tinggi

### C. Kalkulasi Final Auto-Score
Begitu penilaian diberikan, sistem secara otomatis mengalikan Skor Realita tiket tersebut terhadap persentase Bobot Kriteria yang sudah dikonfigurasi melalui persamaan matematis:

`Total Score AHP = ∑(Skor Kriteria 'N' × Bobot AHP Kriteria 'N')`

Contoh: Jika bobot kriteria Urgensi adalah 40% (0.4) dan pengguna memberi nilai 5 untuk urgensi, maka:
Skor Total = (5 * 0.4) + perhitungan kriteria lain...
Maksimal nilai `Total Score AHP` adalah **5.00**.

### D. Pemetaan Skala Prioritas (Mapping)
Sistem menggunakan rentang nilai (threshold) berikut untuk mendeduksi tingkat prioritas tiket secara mutlak:

* **CRITICAL (Sangat Kritis):** Memiliki Total Score ≥ 3.8
* **HIGH (Tinggi):** Memiliki Total Score ≥ 2.8 hingga < 3.8
* **MEDIUM (Sedang):** Memiliki Total Score ≥ 1.5 hingga < 2.8
* **LOW (Rendah):** Memiliki Total Score < 1.5

*Catatan Cerdas Sistem (Edge Case Rules):*
Jika ada pengguna yang memasukkan satu saja kriteria dengan **nilai absolut 5 (Maksimal)**, sistem tidak akan membiarkan tiket tersebut menjadi LOW Priority terlepas dari total perhitungannya, di mana:
- Jika Total Score menunjukkan LOW/MEDIUM, prioritas akan dipaksa naik menjadi **HIGH**.
- Jika pengguna memasukkan nilai 4 pada salah satu kriteria tetapi kalkulasi menunjukkan LOW, tiket akan dinaikkan menjadi **MEDIUM**.

---

## 4. Keuntungan Sistem Penilaian AHP
1. **Mengurangi Subjektivitas:** Supervisor tidak bisa sekadar asal berteriak "Ini Penting!", sistem akan menormalisasi skornya menjadi perbandingan matematis.
2. **Prioritasi Terarah:** IT Support kini bisa melayani urutan pengerjaan tiket sesuai tingkat kritis masalah di lapangan, melindungi SLA (Service Level Agreement).
3. **Standar Penyelesaian Tepat Janji:** Fitur AHP dapat dikaitkan dengan jam penyelesaian otomatis (mis: CRITICAL = wajib selesai dalam 2 jam).

Sekian panduan cara kerja pengukuran AHP pada skema prioritas penyelesaian pelaporan (ticketing) departemen operasional.
