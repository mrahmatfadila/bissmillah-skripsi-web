# Activity Diagrams - IT Ticketing Support

Berikut adalah kumpulan Activity Diagram untuk sistem IT Ticketing Support, mencakup berbagai modul seperti Auth, Pembuatan Tiket (AHP), Manajemen Tiket, Operasional, dan Admin.

## 1. Modul Akses & Keamanan (Auth)

### Activity Diagram: Logout
*Proses menghapus session dan redirect ke halaman login.*

```mermaid
graph TD
    Start((Mulai)) --> UserClickLogout[User Klik Menu Logout]
    UserClickLogout --> SystemInvalidateSession[Sistem Menghapus Session]
    SystemInvalidateSession --> SystemRedirect[Redirect ke Halaman Login]
    SystemRedirect --> End((Selesai))
```

## 2. Modul Pembuatan Tiket (Core Feature)

### Activity Diagram: Create Ticket (Standard/Manual)
*Flow user membuat tiket biasa dengan memilih prioritas secara langsung.*

```mermaid
graph TD
    Start((Mulai)) --> UserAccessCreate[User Akses Menu Buat Tiket]
    UserAccessCreate --> ShowForm[Sistem Menampilkan Form Tiket]
    ShowForm --> UserFillForm[User Mengisi Judul, Deskripsi, Kategori & Lokasi]
    UserFillForm --> UserSelectPriority[User Memilih Prioritas Manual (Low/Medium/High)]
    UserSelectPriority --> UserSubmit[User Klik Submit]
    UserSubmit --> ValidateData{Validasi Data?}
    ValidateData -->|Tidak Valid| ShowError[Tampilkan Error]
    ShowError --> UserFillForm
    ValidateData -->|Valid| SaveTicket[Sistem Menyimpan Tiket (Status: Open)]
    SaveTicket --> NotifyAdmin[Sistem Mengirim Notifikasi ke Admin]
    NotifyAdmin --> RedirectList[Redirect ke Halaman Tiket Saya]
    RedirectList --> End((Selesai))
```

### Activity Diagram: Create Ticket dengan Analisis AHP
*Flow user mengisi kriteria, sistem menghitung bobot, memberikan rekomendasi, dan menyimpan.*

```mermaid
graph TD
    Start((Mulai)) --> UserAccessAHP[User Akses Menu Buat Tiket AHP]
    UserAccessAHP --> ShowAHPForm[Sistem Menampilkan Form Kriteria AHP]
    ShowAHPForm --> UserInputData[User Mengisi Data Tiket & Kriteria Penilaian]
    UserInputData --> UserClickCalc[User Klik Hitung Prioritas]
    UserClickCalc --> SystemCalcWeight[Sistem Menghitung Bobot dengan AHP]
    SystemCalcWeight --> ShowRecommendation[Sistem Menampilkan Rekomendasi Prioritas (Score)]
    ShowRecommendation --> UserConfirm{User Setuju?}
    UserConfirm -->|Tidak| UserAdjust[User Menyesuaikan Manual]
    UserAdjust --> SaveTicket
    UserConfirm -->|Ya| SaveTicket[Sistem Menyimpan Tiket dengan Prioritas Terhitung]
    SaveTicket --> NotifyAdmin[Sistem Mengirim Notifikasi]
    NotifyAdmin --> RedirectList[Redirect ke Dashboard]
    RedirectList --> End((Selesai))
```

## 3. Modul Manajemen Tiket (User)

### Activity Diagram: Tracking Status Tiket

```mermaid
graph TD
    Start((Mulai)) --> UserViewList[User Melihat Daftar Tiket]
    UserViewList --> UserSelectTicket[User Memilih Tiket]
    UserSelectTicket --> SystemShowDetail[Sistem Menampilkan Detail Tiket]
    SystemShowDetail --> ViewHistory[User Melihat History Status (Trail)]
    ViewHistory --> End((Selesai))
```

### Activity Diagram: Memberikan Komentar & Balasan

```mermaid
graph TD
    Start((Mulai)) --> UserInDetail[User di Halaman Detail Tiket]
    UserInDetail --> TypeComment[User Mengetik Pesan/Komentar]
    TypeComment --> ClickSend[User Klik Kirim]
    ClickSend --> SystemSaveComment[Sistem Menyimpan Komentar]
    SystemSaveComment --> UpdateView[Sistem Memperbarui Tampilan Chat]
    UpdateView --> NotifyParties[Notifikasi ke Pihak Terkait]
    NotifyParties --> End((Selesai))
```

### Activity Diagram: Upload Bukti/Lampiran Tambahan

```mermaid
graph TD
    Start((Mulai)) --> UserInForm[User di Form Tiket / Komentar]
    UserInForm --> SelectFile[User Klik Upload & Pilih Gambar/File]
    SelectFile --> ValidateFile{Validasi Tipe/Size}
    ValidateFile -->|Gagal| ShowError[Tampilkan Error]
    ValidateFile -->|Sukses| UploadProcess[Proses Upload ke Server]
    UploadProcess --> ReturnURL[Sistem Mengembalikan URL File]
    ReturnURL --> ShowPreview[Tampilkan Preview Gambar]
    ShowPreview --> UserSubmit[User Submit Tiket/Komentar]
    UserSubmit --> End((Selesai))
```

## 4. Modul Operasional IT Support (Proses Kerja)

### Activity Diagram: Claim Tiket (Self-Assignment)

```mermaid
graph TD
    Start((Mulai)) --> TechViewUnassigned[Teknisi Melihat Daftar Tiket 'Unassigned']
    TechViewUnassigned --> SelectTicket[Pilih Tiket]
    SelectTicket --> ClickClaim[Klik Tombol 'Claim Ticket']
    ClickClaim --> SystemUpdateAssignee[Sistem Update Assignee = Current User]
    SystemUpdateAssignee --> SystemUpdateStatus[Sistem Update Status = In Progress]
    SystemUpdateStatus --> RefreshView[Refresh Tampilan]
    RefreshView --> End((Selesai))
```

### Activity Diagram: Update Progress Tiket

```mermaid
graph TD
    Start((Mulai)) --> TechInDetail[Teknisi di Detail Tiket]
    TechInDetail --> ClickUpdateStatus[Klik Update Status]
    ClickUpdateStatus --> ChooseStatus[Pilih Status (In Progress -> Resolved)]
    ChooseStatus --> AddNote[Isi Catatan Pengerjaan (Opsional)]
    AddNote --> SaveUpdate[Simpan Perubahan]
    SaveUpdate --> SystemLog[Sistem Mencatat Log Aktivitas]
    SystemLog --> NotifyUser[Notifikasi ke Pembuat Tiket]
    NotifyUser --> End((Selesai))
```

### Activity Diagram: Penanganan Tiket Prioritas Tinggi

```mermaid
graph TD
    Start((Mulai)) --> SystemDetectHigh[Sistem Mendeteksi Tiket High/Critical]
    SystemDetectHigh --> SendUrgentNotif[Kirim Notifikasi Urgensi (WA/Email)]
    SendUrgentNotif --> TechReceive[Teknisi Menerima Alert]
    TechReceive --> TechPrioritize[Teknisi Segera Claim & Kerjakan]
    TechPrioritize --> UpdateFrequent[Update Progress Berkala]
    UpdateFrequent --> Resolve[Resolve Tiket]
    Resolve --> End((Selesai))
```

## 5. Modul Manajemen & Supervisi (Manager/Admin)

### Activity Diagram: Assignment Tiket (Pendelegasian)

```mermaid
graph TD
    Start((Mulai)) --> ManagerViewTicket[Manager Melihat Detail Tiket]
    ManagerViewTicket --> ClickAssign[Klik Tombol Assign]
    ClickAssign --> SelectTech[Pilih Teknisi dari List]
    SelectTech --> ConfirmAssign[Konfirmasi Assignment]
    ConfirmAssign --> SystemUpdateData[Sistem Update Assignee]
    SystemUpdateData --> NotifyTech[Notifikasi ke Teknisi Terpilih]
    NotifyTech --> End((Selesai))
```

### Activity Diagram: Validasi & Closing Tiket

```mermaid
graph TD
    Start((Mulai)) --> TechResolve[Teknisi set Status Check/Resolved]
    TechResolve --> ManagerCheck[Manager Review Hasil Pekerjaan]
    ManagerCheck --> IsValid{Sesuai/Valid?}
    IsValid -->|Tidak| ReopenTicket[Kembalikan ke In Progress (Reopen)]
    ReopenTicket --> NotifyTechReopen[Notifikasi Revisi ke Teknisi]
    IsValid -->|Ya| CloseTicket[Set Status = Closed]
    CloseTicket --> NotifyUserClosed[Notifikasi ke User (Tiket Ditutup)]
    NotifyUserClosed --> End((Selesai))
```

### Activity Diagram: Monitoring Dashboard

```mermaid
graph TD
    Start((Mulai)) --> AdminAccessDash[Akses Halaman Dashboard]
    AdminAccessDash --> SystemFetchData[Sistem Request Data Statistik]
    SystemFetchData --> DisplayCharts[Tampilkan Grafik (Pie/Bar Chart)]
    DisplayCharts --> DisplayKPI[Tampilkan KPI & Tiket Kritis]
    DisplayKPI --> AdminFilter[Admin Filter (Periode/Kategori)]
    AdminFilter --> UpdateCharts[Update Tampilan Grafik]
    UpdateCharts --> End((Selesai))
```

## 6. Modul Manajemen Data Sampah (Spam/Trash)

### Activity Diagram: Pembatalan Tiket (Soft Delete)

```mermaid
graph TD
    Start((Mulai)) --> UserOrAdminSelect[User/Admin Pilih Tiket]
    UserOrAdminSelect --> ClickCancel[Klik Cancel/Hapus]
    ClickCancel --> ConfirmSoft{Konfirmasi?}
    ConfirmSoft -->|Ya| SystemSoftDelete[Set Status = CANCELLED / IsDeleted=True]
    SystemSoftDelete --> MoveToTrash[Pindahkan ke View Sampah]
    MoveToTrash --> End((Selesai))
```

### Activity Diagram: Restore Tiket

```mermaid
graph TD
    Start((Mulai)) --> AdminViewTrash[Akses Halaman Trash/Spam]
    AdminViewTrash --> SelectItem[Pilih Tiket]
    SelectItem --> ClickRestore[Klik Restore]
    ClickRestore --> SystemRestore[Kembalikan Status Awal / IsDeleted=False]
    SystemRestore --> MoveToActive[Kembali ke List Aktif]
    MoveToActive --> End((Selesai))
```

### Activity Diagram: Penghapusan Permanen

```mermaid
graph TD
    Start((Mulai)) --> AdminViewTrash[Akses Halaman Trash]
    AdminViewTrash --> SelectItem[Pilih Tiket]
    SelectItem --> ClickDeletePerm[Klik Hapus Permanen]
    ClickDeletePerm --> ConfirmDangerous{Yakin Hapus?}
    ConfirmDangerous -->|Ya| SystemHardDelete[Hapus Row dari Database]
    SystemHardDelete --> RemoveFile[Hapus File Lampiran Terkait]
    RemoveFile --> End((Selesai))
```

## 7. Modul Knowledge Base (Artikel Solusi)

### Activity Diagram: Membuat Artikel Solusi (KB)

```mermaid
graph TD
    Start((Mulai)) --> AdminMenuKB[Akses Menu Knowledge Base]
    AdminMenuKB --> ClickCreate[Klik Buat Artikel Baru]
    ClickCreate --> FillContent[Isi Judul, Solusi, Kategori]
    FillContent --> SaveKB[Simpan Artikel]
    SaveKB --> PublishKB[Artikel Terbit & Bisa Dicari]
    PublishKB --> End((Selesai))
```

### Activity Diagram: Pencarian Solusi Mandiri

```mermaid
graph TD
    Start((Mulai)) --> UserWantTicket[User Ingin Buat Tiket]
    UserWantTicket --> SearchKeyword[User Ketik Kata Kunci Masalah]
    SearchKeyword --> SystemSearchKB[Sistem Cari di Knowledge Base]
    SystemSearchKB --> ShowResults[Tampilkan Artikel Relevan]
    ShowResults --> UserRead[User Membaca Solusi]
    UserRead --> IsSolved{Masalah Selesai?}
    IsSolved -->|Ya| CancelTicket[User Tidak Jadi Buat Tiket]
    IsSolved -->|Tidak| ProceedTicket[Lanjut Buat Tiket]
    ProceedTicket --> End((Selesai))
```

## 8. Modul Administrasi Sistem (Super Admin)

### Activity Diagram: Kelola User (CRUD)

```mermaid
graph TD
    Start((Mulai)) --> AdminUserPage[Akses Manajemen User]
    AdminUserPage --> Action{Pilih Aksi}
    Action -->|Create| AddUser[Tambah User Baru]
    Action -->|Update| EditUser[Edit Data/Role/Departemen]
    Action -->|Check| ResetPass[Reset Password]
    Action -->|Delete| DeleteUser[Nonaktifkan User]
    AddUser --> SaveDB[Simpan Perubahan ke DB]
    EditUser --> SaveDB
    ResetPass --> SaveDB
    DeleteUser --> SaveDB
    SaveDB --> End((Selesai))
```

### Activity Diagram: Konfigurasi Kriteria AHP

```mermaid
graph TD
    Start((Mulai)) --> AdminConfigPage[Akses Konfigurasi AHP]
    AdminConfigPage --> ViewCriteria[Lihat Kriteria & Bobot Saat Ini]
    ViewCriteria --> EditWeight[Edit Nilai Perbandingan/Bobot]
    EditWeight --> Recalculate[Sistem Hitung Ulang Konsistensi]
    Recalculate --> IsConsistent{Konsisten?}
    IsConsistent -->|Tidak| ShowWarning[Peringatan Rasio Konsistensi]
    IsConsistent -->|Ya| SaveConfig[Simpan Konfigurasi Baru]
    SaveConfig --> End((Selesai))
```

## 9. Modul Notifikasi

### Activity Diagram: Sistem Notifikasi WhatsApp

```mermaid
graph TD
    Start((Mulai)) --> NewTicketEvent[Event: Tiket Baru Dibuat]
    NewTicketEvent --> SystemPrepareData[Siapkan Data (ID, Judul, Pelapor)]
    SystemPrepareData --> CallWAApi[Panggil API WhatsApp Gateway]
    CallWAApi --> SendMessage[Kirim Pesan ke Nomor Admin]
    SendMessage --> AdminReceive[Admin Terima WA]
    AdminReceive --> End((Selesai))
```
