# IT Ticketing Support System — ERD Draw.io

Dokumen ini berisi file XML dan panduan untuk membuat **Entity Relationship Diagram (ERD)** yang sesuai dengan basis data aktual (Prisma schema) di draw.io, dengan menggunakan representasi terstruktur (Entitas, Relasi Diamond, dan Kardinalitas) seperti format akademik Indonesia pada laporan Anda.

## Penjelasan Relasi Entitas Penunjang (AHP, Shift)

Secara fisik di database (`schema.prisma`), tabel-tabel ini tidak memiliki Foreign Key (FK) constraint langsung karena alasan berikut:
1.  **ShiftSchedule & ShiftSwapRequest:** Menghubungkan nama agen menggunakan tipe data `String` biasa (`agentName`, `requesterName`, `targetName`) bukan ID referensial.
2.  **AHPCriteria:** Bobot kriteria dibaca langsung oleh sistem untuk menghitung `ahpScore` pada tiket melalui algoritma kode program.

Namun, untuk keperluan laporan **Skripsi / Tugas Akhir**, seluruh entitas **wajib saling terhubung**. Oleh karena itu, ERD di bawah ini sudah ditambahkan **Hubungan Logis (Logical Relationship)** sebagai berikut:
*   `User (1) - memiliki_shift - ShiftSchedule (M)` (Berdasarkan nama agen)
*   `User (1) - mengajukan - ShiftSwapRequest (M)` (Sebagai pemohon)
*   `User (1) - ditargetkan - ShiftSwapRequest (M)` (Sebagai target pertukaran)
*   `Ticket (M) - dinilai_dengan - AHPCriteria (N)` (Berdasarkan pembobotan kriteria AHP untuk tiket)

---

## Cara Import ke draw.io

1. Buka **draw.io** (https://app.diagrams.net)
2. Buat diagram baru atau buka diagram kosong.
3. Pada menu atas, pilih **Extras → Edit Diagram** (atau **File → Import** jika menggunakan versi desktop).
4. **Hapus** semua teks yang ada di kotak input XML.
5. **Salin dan tempel (copy-paste)** seluruh isi kode XML di bawah ini.
6. Klik **OK** (atau **Apply**). Diagram ERD yang lengkap, berwarna modern, dan teratur akan langsung terbentuk secara otomatis!

---

## XML draw.io (Salin Semua Kode di Bawah Ini)

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />

    <!-- ===== JUDUL DIAGRAM ===== -->
    <mxCell id="title" value="Entity Relationship Diagram (ERD) — IT Ticketing Support System" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=#1a1a2e;" vertex="1" parent="1">
      <mxGeometry x="400" y="20" width="800" height="40" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- ENTITAS UTAMA (Biru Muda / Indigo) -->
    <!-- ============================================================ -->

    <!-- User -->
    <mxCell id="ent_user" value="&lt;b&gt;User (Pengguna)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;&lt;b&gt;nik&lt;/b&gt; (Unique)&lt;br&gt;name&lt;br&gt;&lt;b&gt;email&lt;/b&gt; (Unique)&lt;br&gt;password&lt;br&gt;role (Enum)&lt;br&gt;department&lt;br&gt;location&lt;br&gt;image&lt;br&gt;failedLoginAttempts&lt;br&gt;lockedUntil&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#0288d1;fontColor=#01579b;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="50" y="300" width="180" height="240" as="geometry" />
    </mxCell>

    <!-- Ticket -->
    <mxCell id="ent_ticket" value="&lt;b&gt;Ticket (Tiket)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;&lt;b&gt;ticketNumber&lt;/b&gt; (Unique)&lt;br&gt;title&lt;br&gt;description&lt;br&gt;status (Enum)&lt;br&gt;priority (Enum)&lt;br&gt;category&lt;br&gt;ahpScore&lt;br&gt;&lt;i&gt;creatorId&lt;/i&gt; [FK]&lt;br&gt;&lt;i&gt;assigneeId&lt;/i&gt; [FK, Nullable]&lt;br&gt;&lt;i&gt;kbArticleId&lt;/i&gt; [FK, Nullable]&lt;br&gt;attachments (Array)&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#0288d1;fontColor=#01579b;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="600" y="300" width="200" height="260" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- ENTITAS PENDUKUNG (Hijau Muda / Teal) -->
    <!-- ============================================================ -->

    <!-- Comment -->
    <mxCell id="ent_comment" value="&lt;b&gt;Comment (Komentar)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;content&lt;br&gt;&lt;i&gt;ticketId&lt;/i&gt; [FK]&lt;br&gt;&lt;i&gt;authorId&lt;/i&gt; [FK]&lt;br&gt;attachments (Array)&lt;br&gt;createdAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontColor=#1b5e20;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="350" y="750" width="180" height="130" as="geometry" />
    </mxCell>

    <!-- KnowledgeBase -->
    <mxCell id="ent_kb" value="&lt;b&gt;KnowledgeBase (Artikel)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;title&lt;br&gt;content&lt;br&gt;category&lt;br&gt;tags&lt;br&gt;&lt;i&gt;authorId&lt;/i&gt; [FK]&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontColor=#1b5e20;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="600" y="20" width="200" height="160" as="geometry" />
    </mxCell>

    <!-- Notification -->
    <mxCell id="ent_notif" value="&lt;b&gt;Notification (Notifikasi)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;&lt;i&gt;userId&lt;/i&gt; [FK]&lt;br&gt;&lt;i&gt;ticketId&lt;/i&gt; [FK, Nullable]&lt;br&gt;title&lt;br&gt;message&lt;br&gt;type&lt;br&gt;read (Boolean)&lt;br&gt;link&lt;br&gt;createdAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontColor=#1b5e20;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1050" y="300" width="200" height="180" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- ENTITAS STANDALONE / MASTER DATA / KONFIGURASI (Ungu) -->
    <!-- ============================================================ -->

    <!-- AHPCriteria -->
    <mxCell id="ent_ahp" value="&lt;b&gt;AHPCriteria (Kriteria)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;name&lt;br&gt;weight&lt;br&gt;description&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;fontColor=#4a148c;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="900" y="980" width="180" height="140" as="geometry" />
    </mxCell>


    <!-- ShiftSchedule -->
    <mxCell id="ent_schedule" value="&lt;b&gt;ShiftSchedule (Jadwal Shift)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;date&lt;br&gt;shift&lt;br&gt;agentName&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;fontColor=#4a148c;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="350" y="980" width="180" height="140" as="geometry" />
    </mxCell>

    <!-- ShiftSwapRequest -->
    <mxCell id="ent_swap" value="&lt;b&gt;ShiftSwapRequest (Tukar Shift)&lt;/b&gt;&lt;hr&gt;&lt;b&gt;id&lt;/b&gt; [PK]&lt;br&gt;requesterName&lt;br&gt;requesterShift&lt;br&gt;requesterDate&lt;br&gt;targetName&lt;br&gt;targetShift&lt;br&gt;targetDate&lt;br&gt;reason&lt;br&gt;status&lt;br&gt;approvedBy&lt;br&gt;approvedAt&lt;br&gt;createdAt&lt;br&gt;updatedAt" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;fontColor=#4a148c;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="50" y="980" width="200" height="250" as="geometry" />
    </mxCell>


    <!-- ============================================================ -->
    <!-- RELASI DIAMOND (Amber / Orange) -->
    <!-- ============================================================ -->

    <!-- menyusun (User -> KB) -->
    <mxCell id="rel_menyusun" value="menyusun" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="380" y="70" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- membuat (User -> Ticket) -->
    <mxCell id="rel_membuat" value="membuat" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="380" y="280" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- ditugaskan (User -> Ticket) -->
    <mxCell id="rel_ditugaskan" value="ditugaskan" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="380" y="370" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- menerima (User -> Notification) -->
    <mxCell id="rel_menerima" value="menerima" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="380" y="470" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- menulis (User -> Comment) -->
    <mxCell id="rel_menulis" value="menulis" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="240" y="640" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- memiliki (Ticket -> Comment) -->
    <mxCell id="rel_memiliki" value="memiliki" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="540" y="640" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- memicu (Ticket -> Notification) -->
    <mxCell id="rel_memicu" value="memicu" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="890" y="360" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- referensi (KB -> Ticket) -->
    <mxCell id="rel_referensi" value="referensi" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="640" y="210" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- ===== LOGICAL RELATIONS (NEW) ===== -->

    <!-- memiliki_shift (User -> ShiftSchedule) -->
    <mxCell id="rel_user_schedule" value="memiliki_shift" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="280" y="580" width="140" height="60" as="geometry" />
    </mxCell>

    <!-- mengajukan (User -> ShiftSwapRequest) -->
    <mxCell id="rel_user_swap_req" value="mengajukan" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="50" y="750" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- ditargetkan (User -> ShiftSwapRequest) -->
    <mxCell id="rel_user_swap_tar" value="ditargetkan" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="200" y="750" width="120" height="60" as="geometry" />
    </mxCell>

    <!-- dinilai (Ticket -> AHPCriteria) -->
    <mxCell id="rel_ticket_ahp" value="dinilai" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;fontStyle=1;align=center;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="800" y="750" width="140" height="60" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- KONEKSI HUBUNGAN (EDGES) -->
    <!-- ============================================================ -->

    <!-- User - menyusun - KB -->
    <mxCell id="edge_user_menyusun" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=0;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_menyusun" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_menyusun_kb" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="rel_menyusun" target="ent_kb" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- User - membuat - Ticket -->
    <mxCell id="edge_user_membuat" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.15;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_membuat" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_membuat_ticket" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.15;strokeWidth=1.5;" edge="1" source="rel_membuat" target="ent_ticket" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- User - ditugaskan - Ticket -->
    <mxCell id="edge_user_ditugaskan" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.45;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_ditugaskan" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_ditugaskan_ticket" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.45;strokeWidth=1.5;" edge="1" source="rel_ditugaskan" target="ent_ticket" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- User - menerima - Notification -->
    <mxCell id="edge_user_menerima" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.8;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_menerima" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_menerima_notif" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.8;strokeWidth=1.5;edgeStyle=orthogonalEdgeStyle;" edge="1" source="rel_menerima" target="ent_notif" parent="1">
      <mxGeometry relative="1" as="geometry">
        <Array as="points">
          <mxPoint x="520" y="500"/>
          <mxPoint x="520" y="600"/>
          <mxPoint x="1000" y="600"/>
          <mxPoint x="1000" y="444"/>
        </Array>
      </mxGeometry>
    </mxCell>

    <!-- User - menulis - Comment -->
    <mxCell id="edge_user_menulis" value="" style="endArrow=none;html=1;rounded=0;exitX=0.75;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_menulis" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_menulis_comment" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.25;entryY=0;strokeWidth=1.5;" edge="1" source="rel_menulis" target="ent_comment" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- Ticket - memiliki - Comment -->
    <mxCell id="edge_ticket_memiliki" value="" style="endArrow=none;html=1;rounded=0;exitX=0.25;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_ticket" target="rel_memiliki" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_memiliki_comment" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.75;entryY=0;strokeWidth=1.5;" edge="1" source="rel_memiliki" target="ent_comment" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- Ticket - memicu - Notification -->
    <mxCell id="edge_ticket_memicu" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_ticket" target="rel_memicu" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_memicu_notif" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="rel_memicu" target="ent_notif" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- KB - referensi - Ticket -->
    <mxCell id="edge_kb_referensi" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_kb" target="rel_referensi" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_referensi_ticket" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="rel_referensi" target="ent_ticket" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- LOGICAL RELATION EDGES -->

    <!-- User - memiliki_shift - ShiftSchedule -->
    <mxCell id="edge_user_schedule" value="" style="endArrow=none;html=1;rounded=0;exitX=0.25;exitY=1;entryX=0;entryY=0.5;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_user_schedule" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_schedule_user" value="" style="endArrow=none;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="rel_user_schedule" target="ent_schedule" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- User - mengajukan - ShiftSwapRequest -->
    <mxCell id="edge_user_swap_req" value="" style="endArrow=none;html=1;rounded=0;exitX=0.1;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_user_swap_req" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_swap_req_user" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.25;entryY=0;strokeWidth=1.5;" edge="1" source="rel_user_swap_req" target="ent_swap" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- User - ditargetkan - ShiftSwapRequest -->
    <mxCell id="edge_user_swap_tar" value="" style="endArrow=none;html=1;rounded=0;exitX=0.4;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_user" target="rel_user_swap_tar" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_swap_tar_user" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.75;entryY=0;strokeWidth=1.5;" edge="1" source="rel_user_swap_tar" target="ent_swap" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- Ticket - dinilai_dengan - AHPCriteria -->
    <mxCell id="edge_ticket_ahp" value="" style="endArrow=none;html=1;rounded=0;exitX=0.75;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="ent_ticket" target="rel_ticket_ahp" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="edge_ahp_ticket" value="" style="endArrow=none;html=1;rounded=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;strokeWidth=1.5;" edge="1" source="rel_ticket_ahp" target="ent_ahp" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- LABEL KARDINALITAS (TEXT) -->
    <!-- ============================================================ -->
    <mxCell id="lbl_u_menyusun" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="110" y="270" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_menyusun_kb" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="570" y="80" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_u_membuat" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="240" y="310" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_membuat_t" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="570" y="310" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_u_ditugaskan" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="240" y="380" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_ditugaskan_t" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="570" y="390" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_u_menerima" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="240" y="470" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_menerima_n" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="1020" y="420" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_u_menulis" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="190" y="580" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_menulis_c" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="380" y="720" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_t_memiliki" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="590" y="580" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_memiliki_c" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="480" y="720" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_t_memicu" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="810" y="400" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_memicu_n" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="1020" y="360" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_kb_referensi" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#1b5e20;" vertex="1" parent="1">
      <mxGeometry x="710" y="190" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_referensi_t" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="710" y="270" width="20" height="20" as="geometry" />
    </mxCell>


    <mxCell id="lbl_user_sched" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="100" y="550" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_sched_user" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#4a148c;" vertex="1" parent="1">
      <mxGeometry x="400" y="950" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_user_swap1" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="60" y="550" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_swap1_user" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#4a148c;" vertex="1" parent="1">
      <mxGeometry x="80" y="950" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_user_swap2" value="1" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="80" y="550" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_swap2_user" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#4a148c;" vertex="1" parent="1">
      <mxGeometry x="160" y="950" width="20" height="20" as="geometry" />
    </mxCell>

    <mxCell id="lbl_ticket_ahp" value="M" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#01579b;" vertex="1" parent="1">
      <mxGeometry x="760" y="570" width="20" height="20" as="geometry" />
    </mxCell>
    <mxCell id="lbl_ahp_ticket" value="N" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#4a148c;" vertex="1" parent="1">
      <mxGeometry x="960" y="950" width="20" height="20" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- LEGENDA DIAGRAM -->
    <!-- ============================================================ -->
    <mxCell id="leg_title" value="LEGENDA WARNA ERD" style="text;html=1;fontStyle=1;fontSize=12;align=left;fontColor=#333333;" vertex="1" parent="1">
      <mxGeometry x="900" y="750" width="200" height="20" as="geometry" />
    </mxCell>
    
    <mxCell id="leg_ent_utama" value="Entitas Utama (User &amp; Ticket)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e1f5fe;strokeColor=#0288d1;fontColor=#01579b;align=center;fontSize=10;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="900" y="780" width="220" height="30" as="geometry" />
    </mxCell>
    <mxCell id="leg_ent_pendukung" value="Entitas Pendukung (Comment, KB, Notif)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontColor=#1b5e20;align=center;fontSize=10;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="900" y="820" width="220" height="30" as="geometry" />
    </mxCell>
    <mxCell id="leg_ent_standalone" value="Master Data / Konfigurasi" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#7b1fa2;fontColor=#4a148c;align=center;fontSize=10;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="900" y="860" width="220" height="30" as="geometry" />
    </mxCell>
    <mxCell id="leg_relation" value="Relasi / Hubungan" style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff8e1;strokeColor=#ff8f00;fontColor=#ff6f00;align=center;fontSize=10;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="900" y="900" width="220" height="40" as="geometry" />
    </mxCell>

  </root>
</mxGraphModel>
