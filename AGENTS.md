# 📋 ATURAN KERJA AI (AI RULES & GUIDELINES)

Dokumen ini berisi aturan wajib, ketat, dan mengikat untuk setiap AI Assistant / Agent yang bekerja pada repositori proyek **IT Ticketing Support**.

---

## 🛑 ATURAN UTAMA & WAJIB DIPATUHI (STRICT RULES)

### 1. 🔄 Git Commit & Push Otomatis
- **Wajib Commit & Push**: Setiap kali selesai melakukan perubahan atau penambahan kode atas instruksi pengguna, AI **wajib** melakukan `git add`, `git commit` dengan pesan deskriptif yang rapi, dan melakukan `git push` ke GitHub branch aktif.
- **Commit Message Rapi**: Gunakan format conventional commits (contoh: `feat: ...`, `fix: ...`, `refactor: ...`, `style: ...`).

---

### 2. 🗄️ Proteksi Data Database (DILARANG HAPUS DATA)
- **Zero Data Loss**: Dilarang keras menjalankan perintah, script, query, atau migrasi yang **menghapus, me-reset, truncate, atau me-drop tabel/data** database yang sudah ada (`prisma migrate reset`, `DROP TABLE`, `DELETE FROM`, dll.) tanpa izin eksplisit tertulis dari pengguna.
- **Data Integrity**: Pastikan relasi data, seed yang ada, dan riwayat data skripsi/proyek tetap aman dan tidak rusak saat melakukan query/update.

---

### 3. 🎨 Preservasi Desain & Fitur Sistem (DILARANG MERUBAH TANPA PERINTAH)
- **Preserve Existing UI/UX**: Dilarang merubah sedikitpun tata letak (layout), skema warna, tema, komponen, tipografi, atau estetika desain yang sudah ada saat ini, kecuali pengguna secara eksplisit meminta perubahan tampilan tertentu.
- **Preserve Existing Features**: Dilarang merubah, menghapus, atau memodifikasi fungsionalitas/fitur bisnis yang sudah berjalan (alur tiket, kalkulasi AHP, notifikasi, shift, monitoring, dll.).
- **Scope Restriction**: Fokus hanya pada task/bagian yang diminta oleh pengguna tanpa merembet ke modul lain.

---

### 4. ⚡ Clean Code & Performa Ringan (Lightweight & Maintainable)
- **Clean Code Standard**:
  - Kode harus terstruktur rapi, modular, mudah dibaca, dan mengikuti konvensi Next.js / TypeScript / Tailwind / Prisma.
  - Terapkan prinsip **DRY (Don't Repeat Yourself)** dan **KISS (Keep It Simple, Stupid)**.
- **Optimasi Performa**:
  - Hindari import library/package yang tidak perlu atau memberatkan bundle.
  - Hindari memory leak, infinite loop/re-render, dan query database yang tidak efisien (N+1 query problem).
  - Hapus kode komentar mati (dead code) yang tidak terpakai dari fitur yang baru dibuat.
  - Pastikan build tidak error (`npm run build` / `npx tsc`).

---

## 📌 Ringkasan Checklist Sebelum AI Menyelesaikan Respon:
- [ ] Apakah ada data database yang terhapus? *(Harus: TIDAK)*
- [ ] Apakah ada desain/fitur yang berubah di luar instruksi? *(Harus: TIDAK)*
- [ ] Apakah kodenya bersih, efisien, dan bebas error? *(Harus: YA)*
- [ ] Apakah perubahan sudah di-commit dan di-push ke GitHub? *(Harus: YA)*
