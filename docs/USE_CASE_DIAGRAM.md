# Use Case Diagram — IT Ticketing Support System

## Cara Import ke draw.io

1. Buka **draw.io** (https://app.diagrams.net)
2. Pilih menu **Extras → Edit Diagram**
3. **Hapus** semua konten yang ada di kotak XML
4. **Copy-paste** XML di bawah ini
5. Klik **OK** → diagram akan muncul otomatis

---

## XML draw.io (Copy semua dari bawah ini)

```xml
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />

    <!-- ===== JUDUL ===== -->
    <mxCell id="title" value="Use Case Diagram — IT Ticketing Support System" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontStyle=1;fontColor=#1a1a2e;" vertex="1" parent="1">
      <mxGeometry x="400" y="20" width="860" height="40" as="geometry" />
    </mxCell>

    <!-- ===== BOUNDARY SYSTEM ===== -->
    <mxCell id="sys" value="&lt;b&gt;IT Ticketing Support System&lt;/b&gt;" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];shape=mxgraph.flowchart.start_2;fillColor=none;strokeColor=#0050EF;strokeWidth=2;fontSize=14;fontStyle=1;verticalAlign=top;spacingTop=10;fontColor=#0050EF;" vertex="1" parent="1">
      <mxGeometry x="280" y="70" width="1100" height="1050" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- AKTOR KIRI -->
    <!-- ============================================================ -->

    <!-- Aktor: Staff/User -->
    <mxCell id="a_staff" value="Staff / User" style="shape=mxgraph.flowchart.actor;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="60" y="140" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- Aktor: IT Support -->
    <mxCell id="a_it" value="IT Support" style="shape=mxgraph.flowchart.actor;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="60" y="400" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- Aktor: Manager -->
    <mxCell id="a_mgr" value="Manager" style="shape=mxgraph.flowchart.actor;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="60" y="660" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- Aktor: Supervisor -->
    <mxCell id="a_spv" value="Supervisor" style="shape=mxgraph.flowchart.actor;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="60" y="820" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- AKTOR KANAN -->
    <!-- ============================================================ -->

    <!-- Aktor: Finance -->
    <mxCell id="a_fin" value="Finance" style="shape=mxgraph.flowchart.actor;fillColor=#FFE6CC;strokeColor=#d79b00;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1480" y="400" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- Aktor: Security -->
    <mxCell id="a_sec" value="Security" style="shape=mxgraph.flowchart.actor;fillColor=#f8cecc;strokeColor=#b85450;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1480" y="560" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- Aktor: Super Admin -->
    <mxCell id="a_admin" value="Super Admin" style="shape=mxgraph.flowchart.actor;fillColor=#f8cecc;strokeColor=#AE4132;fontStyle=1;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1480" y="720" width="60" height="80" as="geometry" />
    </mxCell>

    <!-- ===== GENERALISASI: IT Support IS-A Staff ===== -->
    <mxCell id="gen1" value="" style="endArrow=block;endFill=0;endSize=10;startArrow=none;exitX=0.5;exitY=0;edgeStyle=orthogonalEdgeStyle;" edge="1" source="a_it" target="a_staff" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="gen1lbl" value="&lt;&lt;generalisasi&gt;&gt;" style="text;fontSize=9;fontStyle=2;" vertex="1" parent="1">
      <mxGeometry x="10" y="325" width="110" height="20" as="geometry" />
    </mxCell>

    <!-- ===== GENERALISASI: Manager IS-A Supervisor ===== -->
    <mxCell id="gen2" value="" style="endArrow=block;endFill=0;endSize=10;edgeStyle=orthogonalEdgeStyle;" edge="1" source="a_mgr" target="a_spv" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — AUTENTIKASI -->
    <!-- ============================================================ -->
    <mxCell id="uc_login" value="Login ke Sistem" style="ellipse;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=0;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="320" y="120" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_logout" value="Logout dari Sistem" style="ellipse;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=0;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="320" y="200" width="180" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — TIKET (STAFF) -->
    <!-- ============================================================ -->
    <mxCell id="uc_create" value="Buat Tiket Baru" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="110" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_attach" value="Upload Lampiran / Gambar" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="185" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_viewmine" value="Lihat Tiket Saya" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="260" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_comment" value="Tambah Komentar / Reply" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="335" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_notif" value="Terima Notifikasi" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="410" width="180" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_profile" value="Lihat dan Edit Profil" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="530" y="485" width="180" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — IT SUPPORT -->
    <!-- ============================================================ -->
    <mxCell id="uc_claim" value="Klaim Tiket (Self-Assign)" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="340" width="195" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_status" value="Ubah Status Tiket" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="415" width="195" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_assigned" value="Lihat Tiket Ditugaskan" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="490" width="195" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_kb_create" value="Buat Artikel Knowledge Base" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="565" width="195" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_kb_view" value="Lihat Knowledge Base" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="640" width="195" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_wa_notif" value="Kirim Notifikasi WhatsApp" style="ellipse;fillColor=#d5e8d4;strokeColor=#006600;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="750" y="715" width="195" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — MANAGER / SUPERVISOR -->
    <!-- ============================================================ -->
    <mxCell id="uc_assign" value="Tugaskan Tiket ke IT Support" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="340" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_unassigned" value="Lihat Tiket Belum Ditugaskan" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="415" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_all" value="Lihat Semua Tiket" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="490" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_dashboard" value="Lihat Dashboard dan Statistik" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="565" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_filter" value="Filter Tiket by Status" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="640" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_dept" value="Lihat Tiket per Departemen" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="715" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_analytics" value="Lihat Laporan dan Analitik" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="790" width="200" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_reopen" value="Ubah Status Tiket (Reopen)" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="960" y="865" width="200" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — FINANCE -->
    <!-- ============================================================ -->
    <mxCell id="uc_edc" value="Lihat Masalah EDC" style="ellipse;fillColor=#FFE6CC;strokeColor=#d79b00;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1180" y="380" width="180" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — SECURITY -->
    <!-- ============================================================ -->
    <mxCell id="uc_cctv" value="Lihat Masalah CCTV" style="ellipse;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1180" y="530" width="180" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- USE CASES — SUPER ADMIN -->
    <!-- ============================================================ -->
    <mxCell id="uc_actlog" value="Lihat Log Aktivitas" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1170" y="605" width="205" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_dataquality" value="Lihat Kualitas Data" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1170" y="455" width="205" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_usermgmt" value="Kelola Pengguna (Tambah/Edit/Hapus)" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1170" y="680" width="205" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_ahp" value="Konfigurasi AHP" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1170" y="830" width="205" height="55" as="geometry" />
    </mxCell>
    <mxCell id="uc_spam" value="Kelola Tiket Spam/Cancelled" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="1170" y="980" width="205" height="55" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- RELASI INCLUDE -->
    <!-- ============================================================ -->
    <mxCell id="inc1" value="&lt;&lt;include&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_create" target="uc_attach" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="inc2" value="&lt;&lt;include&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_create" target="uc_wa_notif" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="inc3" value="&lt;&lt;include&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_status" target="uc_wa_notif" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="inc4" value="&lt;&lt;include&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_assign" target="uc_wa_notif" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- RELASI EXTEND -->
    <!-- ============================================================ -->
    <mxCell id="ext1" value="&lt;&lt;extend&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_comment" target="uc_attach" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
    <mxCell id="ext2" value="&lt;&lt;extend&gt;&gt;" style="edgeStyle=orthogonalEdgeStyle;dashed=1;endArrow=open;startArrow=none;fontSize=10;fontStyle=2;" edge="1" source="uc_reopen" target="uc_status" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — STAFF/USER -->
    <!-- ============================================================ -->
    <mxCell id="e1" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_login" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e2" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_logout" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e3" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_create" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e4" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_viewmine" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e5" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_comment" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e6" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_notif" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e7" value="" style="endArrow=none;" edge="1" source="a_staff" target="uc_profile" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — IT SUPPORT -->
    <!-- ============================================================ -->
    <mxCell id="e10" value="" style="endArrow=none;" edge="1" source="a_it" target="uc_claim" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e11" value="" style="endArrow=none;" edge="1" source="a_it" target="uc_status" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e12" value="" style="endArrow=none;" edge="1" source="a_it" target="uc_assigned" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e13" value="" style="endArrow=none;" edge="1" source="a_it" target="uc_kb_create" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e14" value="" style="endArrow=none;" edge="1" source="a_it" target="uc_kb_view" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — MANAGER -->
    <!-- ============================================================ -->
    <mxCell id="e20" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_assign" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e21" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_unassigned" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e22" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_all" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e23" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_dashboard" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e24" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_filter" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e25" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_dept" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e26" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_analytics" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e27" value="" style="endArrow=none;" edge="1" source="a_mgr" target="uc_reopen" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — SUPERVISOR -->
    <!-- ============================================================ -->
    <mxCell id="e30" value="" style="endArrow=none;" edge="1" source="a_spv" target="uc_filter" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e31" value="" style="endArrow=none;" edge="1" source="a_spv" target="uc_dept" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e32" value="" style="endArrow=none;" edge="1" source="a_spv" target="uc_dashboard" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — FINANCE -->
    <!-- ============================================================ -->
    <mxCell id="e40" value="" style="endArrow=none;" edge="1" source="a_fin" target="uc_edc" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — SECURITY -->
    <!-- ============================================================ -->
    <mxCell id="e50" value="" style="endArrow=none;" edge="1" source="a_sec" target="uc_cctv" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- ASOSIASI — SUPER ADMIN -->
    <!-- ============================================================ -->
    <mxCell id="e60" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_usermgmt" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e62" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_ahp" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e64" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_spam" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e65" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_actlog" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e66" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_dataquality" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e67" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_all" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>
    <mxCell id="e68" value="" style="endArrow=none;" edge="1" source="a_admin" target="uc_assign" parent="1"><mxGeometry relative="1" as="geometry" /></mxCell>

    <!-- ============================================================ -->
    <!-- LEGENDA -->
    <!-- ============================================================ -->
    <mxCell id="leg_title" value="LEGENDA" style="text;html=1;fontStyle=1;fontSize=11;align=left;" vertex="1" parent="1">
      <mxGeometry x="300" y="1090" width="100" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg1" value="" style="ellipse;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="300" y="1115" width="30" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg1t" value="Autentikasi / Semua User" style="text;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="336" y="1115" width="130" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg2" value="" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="480" y="1115" width="30" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg2t" value="Staff / IT Support" style="text;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="516" y="1115" width="110" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg3" value="" style="ellipse;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="640" y="1115" width="30" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg3t" value="Manager / Supervisor" style="text;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="676" y="1115" width="120" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg4" value="" style="ellipse;fillColor=#f8cecc;strokeColor=#AE4132;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="810" y="1115" width="30" height="20" as="geometry" />
    </mxCell>
    <mxCell id="leg4t" value="Super Admin / Finance / Security" style="text;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="846" y="1115" width="180" height="20" as="geometry" />
    </mxCell>

  </root>
</mxGraphModel>
```

---

## Daftar Aktor dan Use Case (Referensi Manual)

### Aktor

| Aktor | Keterangan |
|-------|-----------|
| **Staff / User** | Karyawan umum — buat dan pantau tiket miliknya |
| **IT Support** | Tangani tiket, klaim, ubah status |
| **Manager** | Assign tiket, monitor semua tiket, lihat analitik |
| **Supervisor** | Subset Manager — filter dan monitor tiket departemen |
| **Finance** | Khusus lihat masalah EDC |
| **Security** | Khusus lihat masalah CCTV |
| **Super Admin** | Full akses — kelola user, peran, sistem, AHP |

---

### Daftar Use Case Lengkap

| ID | Use Case | Aktor Utama |
|----|----------|-------------|
| UC-01 | Login ke Sistem | Semua |
| UC-02 | Logout dari Sistem | Semua |
| UC-03 | Buat Tiket Baru | Staff, IT Support |
| UC-04 | Upload Lampiran / Gambar | Staff, IT Support |
| UC-05 | Lihat Tiket Saya | Staff, IT Support |
| UC-06 | Tambah Komentar / Reply | Staff, IT Support |
| UC-07 | Terima Notifikasi | Semua |
| UC-08 | Lihat dan Edit Profil | Semua |
| UC-09 | Klaim Tiket (Self-Assign) | IT Support |
| UC-10 | Ubah Status Tiket | IT Support, Manager |
| UC-11 | Lihat Tiket Ditugaskan ke Saya | IT Support |
| UC-12 | Buat Artikel Knowledge Base | IT Support |
| UC-13 | Lihat Knowledge Base | IT Support, Manager, Staff |
| UC-14 | Kirim Notifikasi WhatsApp | Sistem (include) |
| UC-15 | Tugaskan Tiket ke IT Support | Manager, Super Admin |
| UC-16 | Lihat Tiket Belum Ditugaskan | Manager, IT Support |
| UC-17 | Lihat Semua Tiket | Manager, Super Admin |
| UC-18 | Lihat Dashboard dan Statistik | Manager, Supervisor, Super Admin |
| UC-19 | Filter Tiket by Status | Manager, Supervisor, IT Support |
| UC-20 | Lihat Tiket per Departemen | Manager, Supervisor |
| UC-21 | Lihat Laporan dan Analitik | Manager |
| UC-22 | Ubah Status Tiket (Reopen) | Manager (extend UC-10) |
| UC-23 | Lihat Masalah EDC | Finance |
| UC-24 | Lihat Masalah CCTV | Security |
| UC-25 | Kelola Pengguna (Tambah/Edit/Hapus) | Super Admin |
| UC-27 | Konfigurasi AHP | Super Admin |
| UC-29 | Kelola Tiket Spam/Cancelled | Super Admin |
| UC-30 | Lihat Log Aktivitas | Super Admin |
| UC-31 | Lihat Kualitas Data | Super Admin |

---

### Relasi Include dan Extend

| Relasi | Dari | Ke | Jenis |
|--------|------|-----|-------|
| UC-03 to UC-04 | Buat Tiket | Upload Lampiran | include |
| UC-03 to UC-14 | Buat Tiket | Kirim Notifikasi WA | include |
| UC-10 to UC-14 | Ubah Status | Kirim Notifikasi WA | include |
| UC-15 to UC-14 | Assign Tiket | Kirim Notifikasi WA | include |
| UC-06 to UC-04 | Tambah Komentar | Upload Lampiran | extend |
| UC-22 to UC-10 | Reopen Tiket | Ubah Status | extend |
