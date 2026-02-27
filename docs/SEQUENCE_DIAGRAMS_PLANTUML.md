# Sequence Diagrams (PlantUML)

Salin kode di dalam blok code di bawah ini ke editor PlantUML (seperti PlantText atau IntelliJ IDEA Plugin).

## 1. Login & Autentikasi (Auth Modul)
Diagram ini menjelaskan proses login pengguna menggunakan kredensial (Email/Password) dan validasi role.

```plantuml
@startuml
skinparam handwritten false
skinparam monochrome false
skinparam shadowing true

actor User as "Pengguna"
boundary UI as "Halaman Login"
control Auth as "NextAuth Logic"
database DB as "Database (User)"

User -> UI : Buka Halaman Login
UI -> User : Tampilkan Form Login
User -> UI : Input Email & Password
UI -> Auth : POST /api/auth/callback/credentials\n(email, password)
activate Auth

Auth -> DB : Query User by Email
activate DB
DB --> Auth : Return User Data (Hash Password)
deactivate DB

Auth -> Auth : Verifikasi Password (Bcrypt)

alt Password Valid
    Auth -> DB : Update Session / Token
    Auth --> UI : Login Sukses (Session Created)
    UI -> User : Redirect ke Dashboard (Sesuai Role)
else Password Salah / User Tidak Ditemukan
    Auth --> UI : Error: Invalid Credentials
    UI -> User : Tampilkan Pesan Error
end

deactivate Auth
@enduml
```

## 2. Pembuatan Tiket dengan AHP (Create Ticket)
Diagram ini menjelaskan alur pembuatan tiket dimana sistem otomatis menghitung prioritas menggunakan metode AHP.

```plantuml
@startuml
skinparam boxPadding 10

actor User as "Staff / Pelapor"
boundary UI as "Form Buat Tiket"
control API as "API: /api/tickets/create"
control AHP as "AHP Calculation Logic"
database DB as "Database"
control WA as "WhatsApp Service"

User -> UI : Isi Judul, Deskripsi & Kriteria AHP
UI -> API : POST /api/tickets/create\n(Data Tiket + Skor AHP)
activate API

API -> API : Cek Session (Auth)

group Proses Hitung Prioritas (AHP)
    API -> DB : Get Kriteria & Bobot (AHPCriteria)
    activate DB
    DB --> API : List Bobot
    deactivate DB
    
    API -> AHP : Hitung Skor (Input User * Bobot)
    activate AHP
    AHP -> AHP : Normalisasi & Sum
    AHP --> API : Return Skor Final & Prioritas\n(Low/Medium/High/Critical)
    deactivate AHP
end

API -> DB : Create Ticket (Status: OPEN, Priority: From AHP)
activate DB
DB --> API : Ticket Created (ID: TIK-001)
deactivate DB

par Notifikasi Async
    API -> WA : Kirim Pesan WA ke IT Support/Admin
    WA --> User : (Optional) Notifikasi ke Manager
end

API --> UI : Response Sukses (201 Created)
deactivate API

UI -> User : Tampilkan Sukses & Redirect ke Detail
@enduml
```

## 3. Penugasan Tiket (Ticket Assignment)
Diagram ini menjelaskan bagaimana Manager atau Admin menugaskan tiket kepada Staff IT.

```plantuml
@startuml
actor Manager as "Manager / Admin"
boundary UI as "Dashboard Manager"
control API as "API: /api/tickets/assigned"
database DB as "Database"
actor Staff as "Staff IT (Assignee)"

Manager -> UI : Lihat Tiket 'Unassigned'
UI -> API : GET /api/tickets/unassigned
activate API
API -> DB : Query Tiket (Status: Open, Assignee: Null)
DB --> API : List Tiket
API --> UI : Tampilkan Data
deactivate API

Manager -> UI : Pilih Staff & Klik 'Assign'
UI -> API : PUT /api/tickets/{id}/assign\n(assigneeId)
activate API

API -> API : Cek Role Manager
API -> DB : Update Tiket (Assignee = ID Staff, Status = IN_PROGRESS)
activate DB
DB --> API : Update Success
deactivate DB

API -> API : Create Notification Log

API --> UI : Response OK
deactivate API

UI -> Manager : Update Tampilan List Tiket

note right of Staff : Staff bisa melihat tiket ini\ndi menu 'Tiket Saya'
@enduml
```

## 4. Diskusi & Komentar (Comment Flow)
Diagram ini menjelaskan interaksi komentar antara Pelapor dan IT Support.

```plantuml
@startuml
actor User as "Pelapor / Staff IT"
boundary UI as "Halaman Detail Tiket"
control API as "API: /api/tickets/{id}/comments"
database DB as "Database"
control Notify as "Notification System"

User -> UI : Ketik Komentar & Kirim
UI -> API : POST /api/tickets/{id}/comments\n(Content, Attachments)
activate API

API -> DB : Simpan Komentar
activate DB
DB --> API : Komentar Tersimpan
deactivate DB

API -> DB : Get Ticket Details (Creator & Assignee)
activate DB
DB --> API : Return Info Pembuat & Teknisi
deactivate DB

alt Jika Pelapor yang komen
    API -> Notify : Buat Notifikasi untuk Teknisi
else Jika Teknisi yang komen
    API -> Notify : Buat Notifikasi untuk Pelapor
end

API --> UI : Response JSON (Komentar Baru)
deactivate API

UI -> User : Update List Komentar (Realtime/Optimistic)
@enduml
```

## 5. Penyelesaian Tiket (Resolution Flow)
Diagram ini menjelaskan penutupan tiket oleh Staff IT atau Manager.

```plantuml
@startuml
actor IT as "Staff IT / Manager"
boundary UI as "Detail Tiket"
control API as "API: /api/tickets/{id}/status"
database DB as "Database"
control WA as "WhatsApp Service"
actor User as "Pelapor"

IT -> UI : Ubah Status Tiket -> RESOLVED/CLOSED
UI -> API : PATCH /api/tickets/{id}/status\n(status: CLOSED)
activate API

API -> DB : Update Status Tiket
activate DB
DB --> API : Sukses
deactivate DB

group Notifikasi Selesai
    API -> WA : Kirim Pesan WA ke Pelapor
    WA -> User : "Tiket Anda Telah Selesai"
end

API --> UI : Response Sukses
deactivate API

UI -> IT : Status Tiket Berubah jadi Hijau (Closed)
@enduml
```

## 6. Manajemen Spam (Spam Handling)
Diagram ini menjelaskan pemindahan tiket ke folder Spam atau penghapusan permanen.

```plantuml
@startuml
actor Admin as "Admin"
boundary UI as "Dashboard Tiket"
control API as "API: /api/tickets/{id}/spam"
database DB as "Database"

Admin -> UI : Pilih Tiket -> Tandai Spam
UI -> API : PATCH /api/tickets/{id}/status\n(status: CANCELLED/SPAM)
activate API

API -> DB : Update Status -> CANCELLED
activate DB
DB --> API : Sukses
deactivate DB

API --> UI : Response OK
deactivate API
UI -> Admin : Tiket Hilang dari List Utama

== Hapus Permanen (Hard Delete) ==
Admin -> UI : Buka Menu Spam -> Hapus Permanen
UI -> API : DELETE /api/tickets/spam/{id}
activate API
API -> DB : Transaction: Delete Comments, Notifs, Ticket
activate DB
DB --> API : Deleted
deactivate DB
API --> UI : Response OK
deactivate API
UI -> Admin : Tiket Terhapus Selamanya
@enduml
```
