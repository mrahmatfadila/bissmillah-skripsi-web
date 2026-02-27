# Full Sequence Diagrams (Mermaid Format)

Dokumen ini berisi **Sequence Diagram** yang direvisi ke format **Mermaid** agar mudah dirender dan dibaca. Kontennya tetap sesuai dengan logika sistem aktual (API & Database).

**Poin Penting:**
1. **Perhitungan AHP**: Terjadi otomatis di Server (`POST /api/tickets/create`).
2. **Assignment**: Menggunakan menu "Belum Ditugaskan" (akses Admin/IT Support).
3. **Update Status**: Backend otomatis mencatat Log Komentar sistem.
4. **Notifikasi**: Berjalan secara *asynchronous* (paralel).

---

## 1. Modul Akses & Keamanan

### A. Sequence Diagram: Logout
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as UI (Navbar/Sidebar)
    participant Auth as NextAuth Logic
    participant Session as Session Store

    User->>UI: Klik "Keluar" (Logout)
    UI->>Auth: POST /api/auth/signout
    activate Auth
    Auth->>Session: Hapus Sesi Browser
    activate Session
    Session-->>Auth: Sesi Berhasil Dihapus
    deactivate Session
    Auth-->>UI: Redirect ke Halaman Login
    deactivate Auth
    UI->>User: Tampilkan Halaman Login
```

---

## 2. Modul Pembuatan Tiket (Core)

### B. Sequence Diagram: Create Ticket (Standar)
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Form Tiket
    participant API as API: /api/tickets/create
    participant DB as Database
    participant WA as Layanan WhatsApp

    User->>UI: Klik "Buat Tiket"
    UI->>User: Tampilkan Form Input
    User->>UI: Isi Judul, Deskripsi, Kategori, Prioritas
    User->>UI: Klik "Submit"
    UI->>API: POST /api/tickets/create
    activate API
    API->>API: Validasi Kelengkapan Data
    
    rect rgb(255, 240, 240)
        Note right of API: Jika Data Tidak Lengkap
        API-->>UI: Error (400 Bad Request)
        UI->>User: Tampilkan Pesan Error
    end
    
    API->>DB: Simpan Tiket (Status: OPEN)
    activate DB
    DB-->>API: Tiket Terbentuk
    deactivate DB
    
    par Notifikasi Async
        API->>WA: Kirim Notifikasi WA (Tanpa Menunggu)
    end
    
    API-->>UI: Respon Sukses (201 Created)
    deactivate API
    UI->>User: Redirect ke "Tiket Saya"
```

### C. Sequence Diagram: Create Ticket dengan AHP
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Form AHP Tiket
    participant API as API: /api/tickets/create
    participant DB as Database
    participant WA as Layanan WhatsApp

    User->>UI: Input Data & Geser Slider Kriteria (Skor AHP)
    User->>UI: Klik "Kirim Tiket"
    UI->>API: POST /api/tickets/create
    activate API

    rect rgb(240, 248, 255)
        Note right of API: Kalkulasi AHP (Server Side)
        API->>DB: Ambil Data Kriteria (Bobot)
        activate DB
        DB-->>API: List Kriteria & Bobot
        deactivate DB
        
        API->>API: Hitung Skor (Input User x Bobot)
        API->>API: Tentukan Prioritas (Low/Med/High/Critical)
    end

    API->>DB: Simpan Tiket (Prioritas Hasil AHP, Status: OPEN)
    activate DB
    DB-->>API: Tiket Tersimpan dengan ID Baru
    deactivate DB

    par Notifikasi Async
        API->>WA: Kirim Pesan WA ke IT Support
    end

    API-->>UI: Respon Sukses (201 Created)
    deactivate API
    UI->>User: Tampilkan Pesan Sukses
```

---

## 3. Modul Manajemen Tiket (User)

### D. Sequence Diagram: Tracking Status & History
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Halaman Detail Tiket
    participant API as API: /api/tickets/[id]
    participant DB as Database

    User->>UI: Klik Judul Tiket dari List
    UI->>API: GET /api/tickets/{id}
    activate API
    API->>DB: Query Detail Tiket (Join Creator, Assignee, History)
    activate DB
    DB-->>API: Data Lengkap Tiket
    deactivate DB
    API-->>UI: Return JSON Data
    deactivate API
    UI->>User: Tampilkan Detail, Status Badge, & Timeline
```

### E. Sequence Diagram: Komentar & Balasan
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Kolom Chat
    participant API as API: /api/tickets/[id]/comments
    participant DB as Database
    participant Notif as Sistem Notifikasi

    User->>UI: Ketik Pesan & Klik Kirim
    UI->>API: POST /api/tickets/{id}/comments
    activate API
    API->>DB: Simpan Komentar ke Tabel Comment
    activate DB
    DB-->>API: Komentar Tersimpan
    deactivate DB

    API->>DB: Ambil Info Pembuat & Assignee
    activate DB
    DB-->>API: Info User
    deactivate DB

    rect rgb(255, 255, 240)
        Note right of API: Notifikasi Internal
        alt User adalah Pembuat
            API->>Notif: Buat Notifikasi untuk IT Support
        else User adalah IT Support
            API->>Notif: Buat Notifikasi untuk Pembuat
        end
        API->>DB: Simpan Log Notifikasi
    end

    API-->>UI: Kembalikan Data Komentar Baru
    deactivate API
    UI->>User: Update Tampilan Chat secara Realtime
```

### F. Sequence Diagram: Upload Bukti
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Komponen Upload
    participant API as API: /api/upload
    participant FS as File System (/public/uploads)

    User->>UI: Pilih File Gambar dari Komputer
    UI->>API: POST /api/upload (FormData)
    activate API
    API->>API: Validasi Tipe & Ukuran File
    API->>FS: Simpan File ke Disk Server
    activate FS
    FS-->>API: File Berhasil Disimpan
    deactivate FS
    API-->>UI: Return URL File (/uploads/...)
    deactivate API
    UI->>User: Preview Gambar Tampil
    Note right of User: URL ini akan dikirim otomatis saat<br/>Submit Tiket atau Komentar
```

---

## 4. Modul Operasional IT Support

### G. Sequence Diagram: Claim Tiket (Ambil Tiket)
```mermaid
sequenceDiagram
    autonumber
    actor IT as IT Support
    participant UI as Menu Belum Ditugaskan
    participant API as API: /api/tickets/[id]/claim
    participant DB as Database

    IT->>UI: Buka Menu "Belum Ditugaskan"
    UI->>API: GET /api/tickets/unassigned
    activate API
    API-->>UI: List Tiket (JSON)
    deactivate API

    IT->>UI: Pilih Tiket -> Klik "Ambil Tiket"
    UI->>API: PUT /api/tickets/{id}/claim
    activate API
    API->>API: Validasi Tiket (Pastikan Belum Assign)
    API->>DB: Update Assignee = IT ID
    API->>DB: Update Status = IN_PROGRESS
    activate DB
    DB-->>API: Tiket Terupdate
    deactivate DB
    API-->>UI: Respon Sukses
    deactivate API
    UI->>IT: Pindahkan Tiket ke Menu "Tugas Saya"
```

### H. Sequence Diagram: Update Progress
```mermaid
sequenceDiagram
    autonumber
    actor IT as IT Support
    participant UI as Detail Tiket
    participant API as API: /api/tickets/[id]/status
    participant DB as Database

    IT->>UI: Ubah Status -> RESOLVED / IN_PROGRESS
    UI->>API: PUT /api/tickets/{id}/status (status: 'RESOLVED')
    activate API
    API->>API: Validasi Status Valid
    API->>DB: Update Status Tiket
    activate DB
    DB-->>API: Status Terupdate
    deactivate DB

    API->>DB: Buat Komentar Sistem ("Status changed to RESOLVED")
    activate DB
    DB-->>API: Komentar Terbuat
    deactivate DB

    API-->>UI: Respon Sukses
    deactivate API
    UI->>IT: Update Status & Warna Badge di Layar
```

### I. Sequence Diagram: Notifikasi & Respon (Flow IT Support)
```mermaid
sequenceDiagram
    autonumber
    participant System as System
    participant Trigger as Event: Tiket Baru
    participant WA_Svc as Layanan WhatsApp
    actor IT as IT Support
    participant UI as Dashboard Web

    Trigger->>System: Event Tiket Dibuat
    System->>WA_Svc: Kirim Pesan WA (Judul, Prioritas)
    WA_Svc->>IT: Notifikasi WA Masuk di HP
    IT->>IT: Baca Pesan
    alt Prioritas HIGH/CRITICAL
        IT->>UI: Login & Buka Dashboard
        UI->>IT: Tampilkan Menu "Belum Ditugaskan"
        IT->>UI: Segera Ambil Tiket (Claim)
    else Prioritas LOW
        IT->>IT: Masukkan ke Antrian Kerja
    end
```

---

## 5. Modul Manajemen (Manager)

### J. Sequence Diagram: Assignment (Pendelegasian Manual)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as IT Manager (Super Admin)
    participant UI as Halaman Belum Ditugaskan
    participant API as API: /api/tickets/unassigned
    participant DB as Database
    participant Notif as Sistem Notifikasi

    Admin->>UI: Buka Menu "Belum Ditugaskan"
    UI->>API: GET /api/tickets/unassigned
    activate API
    API->>DB: Ambil Tiket Kosong (Penerima: NULL)
    activate DB
    DB-->>API: Daftar Tiket Kosong
    deactivate DB
    API-->>UI: Tampilkan Daftar Tiket
    deactivate API

    Admin->>UI: Pilih Tiket & Klik Tombol "Simpan"
    UI->>API: PUT /api/tickets/{id}/assign (assigneeId)
    activate API

    API->>API: Validasi Peran (Wajib Admin/Manager IT)
    API->>DB: Perbarui Tiket (Set Staff & Status = IN_PROGRESS)
    activate DB
    DB-->>API: Data Berhasil Diperbarui
    deactivate DB

    API->>Notif: Buat Log Notifikasi (Untuk IT Support Terpilih)
    API-->>UI: Respon Sukses (200 OK)
    deactivate API

    UI->>Admin: Refresh Tampilan (Tiket Berpindah Daftar)
```

### K. Sequence Diagram: Validasi & Closing
```mermaid
sequenceDiagram
    autonumber
    actor Admin as IT Manager
    participant UI as Detail Tiket
    participant API as API: /api/tickets/[id]/status
    participant DB as Database

    Admin->>UI: Review Hasil Kerja (Status: RESOLVED)
    alt Hasil Valid (Selesai)
        Admin->>UI: Set Status -> CLOSED
        UI->>API: PUT /api/tickets/{id}/status (CLOSED)
        API->>DB: Update Status CLOSED
        API->>DB: Tambah Komentar Sistem (Log)
    else Hasil Tidak Valid
        Admin->>UI: Kembalikan Status -> IN_PROGRESS
        UI->>API: PUT /api/tickets/{id}/status (IN_PROGRESS)
        API->>DB: Update Status IN_PROGRESS
        API->>DB: Tambah Komentar Sistem (Re-open Log)
    end
    API-->>UI: Respon Sukses
    UI->>Admin: Tampilan Terupdate
```

### L. Sequence Diagram: Monitoring Dashboard
```mermaid
sequenceDiagram
    autonumber
    actor User as Manager / Admin
    participant UI as Halaman Dashboard
    participant API as API: /api/tickets/stats
    participant DB as Database

    User->>UI: Buka Dashboard
    UI->>API: GET /api/tickets/stats
    activate API
    API->>DB: Hitung Jumlah Tiket (Total, Unassigned, Selesai)
    activate DB
    DB-->>API: Data Statistik (Agregat)
    deactivate DB
    API-->>UI: Return JSON Data
    deactivate API
    UI->>UI: Render Grafik & Widget Angka
    UI->>User: Tampilkan Ringkasan Kinerja
```

---

## 6. Modul Manajemen Data Sampah (Spam)

### M. Sequence Diagram: Pembatalan Tiket (Soft Delete)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / IT Support
    participant UI as Detail Tiket
    participant API as API: /api/tickets/[id]/status
    participant DB as Database

    Admin->>UI: Set Status -> CANCELLED (Batalkan)
    UI->>API: PUT /api/tickets/{id}/status
    activate API
    API->>DB: Update Status = CANCELLED
    API->>DB: Tambah Komentar Sistem
    activate DB
    DB-->>API: Berhasil Diupdate
    deactivate DB
    API-->>UI: Respon OK
    deactivate API
    UI->>Admin: Tiket Pindah ke Menu "Spam"
```

### N. Sequence Diagram: Restore (Pulihkan Data)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / IT Support
    participant UI as Menu Spam
    participant API as API: /api/tickets/[id]/restore
    participant DB as Database

    Admin->>UI: Buka Menu "Spam"
    Admin->>UI: Klik Tombol "Pulihkan" (Restore)
    UI->>API: PATCH /api/tickets/{id}/restore
    activate API
    API->>DB: Update Status = OPEN
    activate DB
    DB-->>API: Berhasil
    deactivate DB
    API-->>UI: Respon OK
    deactivate API
    UI->>Admin: Tiket Kembali ke List Aktif
```

### O. Sequence Diagram: Hapus Permanen (Hard Delete)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin
    participant UI as Menu Spam
    participant API as API: /api/tickets/[id]
    participant DB as Database

    Admin->>UI: Klik Tombol "Hapus Permanen"
    UI->>Admin: Konfirmasi Dialog "Yakin hapus?"
    Admin->>UI: Klik "Ya"
    UI->>API: DELETE /api/tickets/{id}
    activate API
    API->>DB: Transaction: Hapus Komentar & Notifikasi Terkait
    API->>DB: Hapus Data Tiket dari DB
    activate DB
    DB-->>API: Data Terhapus
    deactivate DB
    API-->>UI: Respon Sukses
    deactivate API
    UI->>Admin: Tiket Hilang Selamanya
```

---

## 7. Modul Knowledge Base (KB)

### P. Sequence Diagram: Membuat Artikel Solusi
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Editor KB
    participant API as API: /api/kb/create
    participant DB as Database

    Admin->>UI: Tulis Judul, Kategori, & Konten
    UI->>API: POST /api/kb/create
    activate API
    API->>DB: Insert Artikel Baru
    activate DB
    DB-->>API: ID Generated
    deactivate DB
    API-->>UI: Respon Sukses
    deactivate API
    UI->>Admin: Redirect ke List Artikel
```

### Q. Sequence Diagram: Pencarian Solusi Mandiri
```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant UI as Halaman KB
    participant API as API: /api/kb/search
    participant DB as Database

    User->>UI: Ketik Kata Kunci Masalah
    UI->>API: GET /api/kb/search?q=keyword
    activate API
    API->>DB: Cari di Database (Full Text Search)
    activate DB
    DB-->>API: List Artikel Cocok
    deactivate DB
    API-->>UI: Return Hasil Pencarian
    deactivate API
    UI->>User: Tampilkan Daftar Solusi
```

---

## 8. Modul Administrasi

### R. Sequence Diagram: Kelola User
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Manajemen User
    participant API as API: /api/users/create
    participant DB as Database

    Admin->>UI: Input Nama, Email, Role, Password
    UI->>API: POST /api/users/create
    activate API
    API->>API: Enkripsi Password (Bcrypt)
    API->>DB: Insert Data User
    activate DB
    DB-->>API: User Berhasil Dibuat
    deactivate DB
    API-->>UI: Respon Sukses
    deactivate API
```

### S. Sequence Diagram: Konfigurasi Kriteria AHP
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Pengaturan AHP
    participant API as API: /api/ahp/criteria
    participant DB as Database

    Admin->>UI: Input Matriks Perbandingan Baru
    UI->>UI: Kalkulasi Bobot & Rasio Konsistensi (Logic di UI)
    Admin->>UI: Klik Simpan Konfigurasi
    UI->>API: POST /api/ahp/criteria
    Note right of API: Data: Array {nama, bobot}
    activate API
    API->>DB: Hapus Semua Kriteria Lama
    API->>DB: Simpan Kriteria Baru
    activate DB
    DB-->>API: Tersimpan
    deactivate DB
    API-->>UI: Respon Sukses
    deactivate API
```

---

## 9. Modul Notifikasi

### T. Sequence Diagram: Notifikasi WhatsApp System
```mermaid
sequenceDiagram
    autonumber
    participant Trigger as Tiket Baru Created
    participant System as Backend System
    participant WA_Svc as Layanan WhatsApp
    participant Gateway as Fonnte / Gateway
    actor IT as IT Support / Admin

    Trigger->>System: Data Tiket Tersimpan
    System->>WA_Svc: Panggil fungsi notifyNewTicket()
    activate WA_Svc
    WA_Svc->>WA_Svc: Susun Pesan (No Tiket, Judul, Prio)
    WA_Svc->>Gateway: HTTP POST /send (ke Nomor Admin)
    activate Gateway
    Gateway-->>WA_Svc: 200 OK (Queued)
    deactivate Gateway
    deactivate WA_Svc
    Gateway->>IT: Pesan WA Masuk di HP
```
