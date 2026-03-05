"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ScheduleUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) { toast.error("Pilih file PDF terlebih dahulu"); return; }
        if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Format file harus PDF"); return; }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/settings/schedule/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Jadwal berhasil diupdate");
                setFile(null);
                window.location.reload();
            } else {
                toast.error(data.error || "Gagal mengunggah jadwal");
            }
        } catch {
            toast.error("Terjadi kesalahan sistem saat unggah PDF");
        } finally {
            setUploading(false);
        }
    };

    const CODES = [
        { code: "P", label: "Pagi", time: "06:00–15:00", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800" },
        { code: "S", label: "Siang", time: "13:30–22:30", color: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 dark:border-blue-700" },
        { code: "M", label: "Malam", time: "21:30–06:30", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700" },
        { code: "L", label: "Libur", time: "Hari Libur", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-200 dark:border-gray-700" },
    ];

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 min-h-screen">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Upload Jadwal Shift IT</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Unggah file PDF jadwal shift bulanan MIS agar sistem membaca dan menampilkannya secara Live di banner atas.
                </p>
            </div>

            {/* Format Guide Alert */}
            <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
                    Format PDF yang Didukung — Schedule Kerja Bulanan MIS
                </AlertTitle>
                <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-sm space-y-3 mt-2">
                    <p>Sistem membaca <strong>tabel jadwal bulanan</strong> seperti yang selama ini Pak Zaenal buat. Struktur yang dikenali:</p>

                    {/* Preview table */}
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden text-xs">
                        {/* Table header: Schedule title */}
                        <div className="bg-blue-600 dark:bg-blue-800 text-white px-3 py-2 font-bold text-[11px] tracking-wide">
                            SCHEDULE KERJA BULAN FEBRUARI 2026 &nbsp;·&nbsp; DEPT / SECTION : MIS
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800">
                                        <th className="text-left px-3 py-2 font-bold text-blue-800 dark:text-blue-300 whitespace-nowrap w-28">NIK</th>
                                        <th className="text-left px-3 py-2 font-bold text-blue-800 dark:text-blue-300 whitespace-nowrap w-32">NAMA</th>
                                        {[1, 2, 3, 4, 5, 6, 7, "...", 28].map((d, i) => (
                                            <th key={i} className="text-center px-1 py-2 font-bold text-blue-800 dark:text-blue-300 min-w-[20px]">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { nik: "8117110002", name: "Zaenal Anwar", shifts: ["S", "M", "L", "L", "P", "S", "M", "...", "S"] },
                                        { nik: "8123040002", name: "Herman", shifts: ["P", "S", "M", "L", "S", "P", "M", "...", "M"] },
                                        { nik: "8118050003", name: "Rahmat Fadila", shifts: ["L", "P", "S", "M", "L", "P", "S", "...", "P"] },
                                    ].map((row, ri) => (
                                        <tr key={ri} className={`border-b border-blue-100 dark:border-blue-900/50 ${ri % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-blue-50/40 dark:bg-blue-950/20"}`}>
                                            <td className="px-3 py-2 font-mono text-muted-foreground">{row.nik}</td>
                                            <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">{row.name}</td>
                                            {row.shifts.map((s, si) => {
                                                const shiftColor: Record<string, string> = {
                                                    P: "text-amber-600 dark:text-amber-400 font-bold",
                                                    S: "text-blue-600 dark:text-blue-400 font-bold",
                                                    M: "text-purple-600 dark:text-purple-400 font-bold",
                                                    L: "text-gray-400 dark:text-gray-500",
                                                };
                                                return (
                                                    <td key={si} className={`text-center px-1 py-2 ${shiftColor[s] || "text-muted-foreground"}`}>
                                                        {s}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Shift code legend */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {CODES.map(s => (
                            <div key={s.code} className={`flex flex-col items-center py-2 rounded-lg ${s.color}`}>
                                <span className="text-2xl font-black leading-tight">{s.code}</span>
                                <span className="text-xs font-semibold">{s.label}</span>
                                <span className="text-[10px] opacity-70 text-center">{s.time}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60">
                        💡 Mesin mengenali NIK 10 digit sebagai penanda baris petugas, lalu membaca kode shift (P/S/M/L) tiap hari dari kolom 1–31 secara otomatis.
                    </p>
                </AlertDescription>
            </Alert>

            {/* Upload Card */}
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="w-5 h-5 text-purple-500" />
                        Unggah Dokumen PDF Jadwal
                    </CardTitle>
                    <CardDescription>Pilih file PDF lalu klik tombol Sinkronisasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="pdf-upload">File Jadwal (PDF)</Label>
                        <Input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {uploading ? "Sistem sedang membaca PDF..." : (
                            <>
                                <Upload className="w-4 h-4" />
                                Sinkronisasi Jadwal ke Sistem
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
