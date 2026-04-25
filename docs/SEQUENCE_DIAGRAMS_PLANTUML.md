# Sequence Diagrams (PlantUML) - Sesuai Implementasi Sistem Aktual (API)

Berikut adalah 15 Sequence Diagram lengkap yang sudah di-scan & dicocokkan langsung dengan baris kode *backend* aktual (Next.js App Router API, Prisma, NextAuth) di sistem yang Anda gunakan saat ini:

## 1. Login (Autentikasi NextAuth)
```plantuml
@startuml
actor User as "User / IT Support"
boundary UI as "Halaman Login"
control System as "NextAuth API\n/api/auth/[...nextauth]"
database DB as "Database"

User -> UI : Masukkan NIK & Password
UI -> System : POST Credentials
System -> DB : Validasi Kredensial & Role
DB --> System : Return User
System -> System : Enkripsi & Buat Session JWT
System --> UI : Set Cookie & Authorize
UI -> User : Redirect ke Dashboard
@enduml
```

## 2. Logout
```plantuml
@startuml
actor User as "User"
boundary UI as "Tampilan Web"
control System as "NextAuth API"

User -> UI : Klik "Keluar" (Logout)
UI -> System : Request signOut()
System -> System : Hapus Sesi / JWT Cookie
System --> UI : Redirect URL
UI -> User : Kembali ke Halaman Login
@enduml
```

## 3. Pencarian Solusi Mandiri (Knowledge Base)
```plantuml
@startuml
actor User as "User"
boundary UI as "Menu Knowledge Base"
control Server as "API /api/kb"
database DB as "Database"

User -> UI : Ketik kata kunci masalah
UI -> Server : GET /api/kb?search=keyword
Server -> DB : Find artikel relevan
DB --> Server : List artikel
Server --> UI : Return JSON Data
UI -> User : Tampilkan Daftar Solusi 
@enduml
```

## 4. Create Ticket (Manual / Standard) 
```plantuml
@startuml
actor User as "User / Pelapor"
boundary UI as "Form Buat Tiket"
control Server as "API: POST /api/tickets/create"
control WA as "WhatsAppService & EmailService"
database DB as "Database (Prisma)"

User -> UI : Isi Judul, Deskripsi, Kategori & Prioritas
UI -> Server : POST JSON (Data + Manual Priority)
Server -> DB : Cek Pengaturan Sistem (AutoAssign dll)

alt Auto Assign Enabled 
    Server -> DB : Cari User Role IT_SUPPORT (Random)
    Server -> Server : Set AssigneeID, Status = IN_PROGRESS
else Manual Assign
    Server -> Server : Status = OPEN, AssigneeID = Null
end

Server -> DB : prisma.ticket.create()
DB --> Server : Sukses (Ticket Dibuat)

Server -> DB : Buat Notifikasi Dalam Web (In-App) untuk Admin/IT
Server -> WA : Trigger Async: notifyNewTicket()
WA -> User : (Berjalan di background)
Server --> UI : Response Sukses (201)
UI -> User : Redirect ke Detail Tiket
@enduml
```

## 5. Create Ticket dengan AHP 
```plantuml
@startuml
actor User as "User"
boundary UI as "Form (+ Slider AHP)"
control Server as "API: POST /api/tickets/create"
control WA as "WhatsApp & Email"
database DB as "Database"

User -> UI : Geser Slider & Isi Detail
UI -> Server : POST JSON (Data & ahpScores)
Server -> DB : GET aHPCriteria (Bobot Kriteria)
DB --> Server : Return Bobot

group Perhitungan AHP Backend
    Server -> Server : Hitung Total = Sum(Input * Bobot)
    Server -> Server : Normalisasi Skor if needed
    Server -> Server : Mapping Skor -> LOW/MEDIUM/HIGH/CRITICAL
    alt Jika ada maks slider (4 atau 5)
        Server -> Server : Override Failsafe (Minimal MEDIUM / HIGH)
    end
end

Server -> DB : Cek sistem Auto-Assign & Simpan Tiket (Create)
DB --> Server : Tiket Tersimpan

Server -> DB : prisma.notification.createMany (Untuk Admin)
Server -> WA : Async trigger notifikasi WA/Email
Server --> UI : Response 201 Created
UI -> User : Tampilkan Notifikasi Sukses
@enduml
```

## 6. Tracking Status & History 
```plantuml
@startuml
actor User as "User"
boundary UI as "Halaman Detail Tiket"
control Server as "API: GET /api/tickets/[id]"
database DB as "Database"

User -> UI : Klik tiket di antrian
UI -> Server : GET /api/tickets/{id}
Server -> DB : prisma.ticket.findUnique()\n(Include: creator, assignee, comments)
DB --> Server : Data Tiket Utuh
Server --> UI : Return JSON 
UI -> User : Render Status Terkini & Tabel History / Komentar
@enduml
```

## 7. Komentar & Balasan (Diskusi)
```plantuml
@startuml
actor Actor as "User / IT Support"
boundary UI as "Tab Percakapan"
control Server as "API: POST /api/tickets/[id]/comments"
database DB as "Database"

Actor -> UI : Ketik pesan & Klik Kirim
UI -> Server : POST Content + Attachments
Server -> DB : prisma.comment.create()
DB --> Server : Komentar Tersimpan

Server -> DB : Get Lawan Bicara (Creator/Assignee)
Server -> DB : Buat Notifikasi (NEW_COMMENT) 
Server --> UI : Kembalikan obyek Komentar
UI -> Actor : Update UI Percakapan secara Real-Time
@enduml
```

## 8. Upload Bukti
```plantuml
@startuml
actor User as "User / IT Support"
boundary UI as "Komponen Upload"
control Server as "API Upload / Cloudinary"

User -> UI : Pilih File Ext (*.jpg, *.png)
UI -> Server : FormData / POST File Image
Server -> Server : Validasi Format & Size
Server -> Server : Simpan ke Media Storage
Server --> UI : Response (Image URL Terenkripsi)
UI -> User : Tampilkan Thumbnail di Area Teks
@enduml
```

## 9. Claim Tiket (Self-Assignment IT Support)
```plantuml
@startuml
actor ITSupport as "IT Support"
boundary UI as "Tombol 'Ambil Tiket'"
control Server as "API: PUT /api/tickets/[id]/claim"
database DB as "Database"

ITSupport -> UI : Buka Tiket Belum Ditugaskan -> Ambil
UI -> Server : PUT /claim
Server -> DB : Cek apakah tiket sudah di-assign (Assignee != null)

alt Sudah Diambil Orang Lain
    Server --> UI : Error "Ticket already assigned" (400)
else Belum Diambil
    Server -> DB : Update assigneeId = session.user.id
    Server -> DB : set status = IN_PROGRESS
    DB --> Server : Sukses Update
    Server --> UI : Response Berhasil
    UI -> ITSupport : Notifikasi "Berhasil Diambil"
end
@enduml
```

## 10. Update Progress & Log Aktivitas
```plantuml
@startuml
actor ITSupport as "IT Support"
boundary UI as "Dropdown Status"
control Server as "API: PUT /api/tickets/[id]/status"
control Ext as "WA / Email Gateway"
database DB as "Database"

ITSupport -> UI : Pilih status baru (Misal: RESOLVED)
UI -> Server : PUT Data { status: "RESOLVED" }
Server -> Server : Validasi jika status valid

Server -> DB : prisma.ticket.update()
Server -> DB : prisma.notification.create() (Ke Pelapor: "Status Berubah")

group Notifikasi & Log
    Server -> Ext : Async Panggil notifyTicketStatusChange
    Server -> DB : prisma.comment.create({content: "Status changed to RESOLVED"})
end

Server --> UI : Return Tiket Update
UI -> ITSupport : Tampil Status Hijau / Selesai Serta Catatan Log "System"
@enduml
```

## 11. Notifikasi Automatis WA (Sistem)
```plantuml
@startuml
control Trigger as "Trigger Backend \n(Create / Status Update)"
control HTTP as "Fonnte / Webhook WA"
actor User as "Penerima (Admin / Pelapor)"

Trigger -> Trigger : Panggil Fungsi WhatsAppService.notify()
Trigger -> HTTP : POST API Request \nAuth Token & Target Number
HTTP -> HTTP : Enqueue Kirim Pesan
HTTP -> User : Kirim Chat WhatsApp Asli (Bot)
@enduml
```

## 12. Pembatalan Tiket (Soft Delete)
```plantuml
@startuml
actor Actor as "User (Creator) / Admin"
boundary UI as "Halaman Tiket"
control Server as "API: PUT /api/tickets/[id]/status"
database DB as "Database"

Actor -> UI : Pilih Update Status menjadi "CANCELLED"
UI -> Server : PUT status = CANCELLED
Server -> Server : Validasi (Sama Seperti Update Status)
Server -> DB : Update tiket.status = CANCELLED
Server -> DB : System Comment "Status changed to CANCELLED"
Server --> UI : Return Berhasil
UI -> Actor : Notifikasi dan Visual berubah jadi Spam/Batal
@enduml
```

## 13. Restore Tiket (Kembalikan Dari Dibatalkan)
```plantuml
@startuml
actor Admin as "Admin / Manager"
boundary UI as "List Tiket Dibatalkan"
control Server as "API: PATCH /api/tickets/[id]/restore"
database DB as "Database"

Admin -> UI : Klik tombol "Restore / Pulihkan"
UI -> Server : PATCH request
Server -> Server : Validasi Role Privileged / Creator Validitas
Server -> DB : prisma.ticket.update({ status: "OPEN" })
DB --> Server : Status Berhasil Dibuka Kembali
Server --> UI : OK (200)
UI -> Admin : Tiket Kembali ke Tab Antrian Aktif Utama
@enduml
```

## 14. Hapus Permanen (Hard Delete Berantai)
```plantuml
@startuml
actor Admin as "Super Admin / Manager"
boundary UI as "Dashboard Spam/Sampah"
control Server as "API: DELETE /api/tickets/[id]"
database DB as "Database"

Admin -> UI : Confirm Hapus Permanen
UI -> Server : DELETE request
Server -> Server : Validasi Session & Role Otoritas

Server -> DB : Memulai prisma.$transaction()
activate DB
DB -> DB : 1. deleteMany() -> Notification relasi
DB -> DB : 2. deleteMany() -> Comment & Diskusi relasi
DB -> DB : 3. delete() -> Data Ticket Utama
DB --> Server : Transaksi Selesai Sukses
deactivate DB

Server --> UI : Response {success: true}
UI -> Admin : Baris Terhapus Selamanya Dari UI
@enduml
```

## 15. Membuat Artikel Knowledge Base
```plantuml
@startuml
actor Adm as "Admin / IT Support"
boundary UI as "Editor Artikel KB"
control Server as "API /api/kb/create"
database DB as "Database"

Adm -> UI : Tulis Solusi & Penjelasan IT
UI -> Server : POST Data Artikel
Server -> DB : Insert Data (prisma.knowledgeBase.create)
DB --> Server : Sukses Masuk
Server --> UI : Response 201
UI -> Adm : Redirect Daftar Bacaan (Selesai)
@enduml
```
