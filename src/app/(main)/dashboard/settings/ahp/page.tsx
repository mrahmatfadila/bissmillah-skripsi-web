"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RefreshCw, Plus, Trash2, CheckCircle2, AlertTriangle, Info, BookOpen, Calculator, ListChecks } from "lucide-react";
import { toast } from "sonner";

const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

const SCALE_LABELS: Record<number, string> = {
    1: "Sama Penting",
    2: "Hampir Sedikit Lebih Penting",
    3: "Sedikit Lebih Penting",
    4: "Hampir Lebih Penting",
    5: "Lebih Penting",
    6: "Hampir Sangat Penting",
    7: "Sangat Penting",
    8: "Hampir Mutlak",
    9: "Mutlak Lebih Penting",
};

// Panduan kontekstual untuk setiap pasang kriteria
const PAIR_GUIDANCE: Record<string, { tip: string; example: string }> = {
    "Urgensi-Dampak": {
        tip: "Urgensi = seberapa CEPAT harus ditangani. Dampak = seberapa PARAH efeknya.",
        example: "Contoh: Jaringan internet mati total (Urgensi TINGGI) vs EDC kasir error (Dampak TINGGI ke pendapatan). Biasanya Urgensi sedikit lebih penting (nilai 3)."
    },
    "Urgensi-Kompleksitas": {
        tip: "Apakah deadline penanganan lebih penting dari tingkat kesulitan perbaikan?",
        example: "Contoh: Printer tidak bisa print (Urgensi: harus segera) vs Masalah konfigurasi server (Kompleks tapi bisa dijadwal). Urgensi biasanya lebih dominan (nilai 3-5)."
    },
    "Urgensi-Cakupan": {
        tip: "Mana lebih penting: kecepatan penanganan atau jumlah pengguna terdampak?",
        example: "Contoh: 1 kasir tidak bisa login (Urgensi tinggi) vs WiFi seluruh toko gangguan (Cakupan luas). Jika cakupan luas, keduanya bisa sama penting (nilai 1-3)."
    },
    "Urgensi-Risiko": {
        tip: "Apakah mendesak itu lebih kritis dari potensi risiko jangka panjang?",
        example: "Contoh: PC tidak bisa nyala (Urgensi) vs Backup data tidak berjalan (Risiko kehilangan data). Risiko jangka panjang seringkali sama atau lebih penting (nilai 1-3 untuk Urgensi)."
    },
    "Dampak-Kompleksitas": {
        tip: "Dampak ke operasional vs kesulitan teknis penyelesaian masalah.",
        example: "Contoh: Sistem POS down (Dampak besar ke penjualan) vs Konfigurasi jaringan VPN rumit (Kompleks). Dampak ke bisnis biasanya lebih penting (nilai 3-5)."
    },
    "Dampak-Cakupan": {
        tip: "Seberapa parah efeknya vs berapa banyak orang terdampak.",
        example: "Contoh: Transaksi gagal di 1 terminal (Dampak besar) vs WiFi lambat di semua toko (Cakupan luas). Seringkali sama penting atau Dampak sedikit lebih penting (nilai 1-3)."
    },
    "Dampak-Risiko": {
        tip: "Efek langsung vs potensi kerugian di masa depan.",
        example: "Contoh: Server down sekarang (Dampak langsung) vs Keamanan data berpotensi bocor (Risiko). Dampak langsung biasanya lebih penting (nilai 3-5)."
    },
    "Kompleksitas-Cakupan": {
        tip: "Tingkat kesulitan teknis vs skala pengguna yang terdampak.",
        example: "Contoh: Bug sistem yang sulit (Kompleks) vs Semua karyawan tidak bisa akses email (Cakupan). Cakupan luas biasanya lebih penting (nilai 3 untuk Cakupan)."
    },
    "Kompleksitas-Risiko": {
        tip: "Apakah masalah sulit lebih penting dari risiko potensial?",
        example: "Contoh: Migrasi sistem rumit (Kompleks) vs Data sensitif terancam (Risiko). Risiko biasanya lebih penting dari kompleksitas teknis (nilai 3-5 untuk Risiko)."
    },
    "Cakupan-Risiko": {
        tip: "Jumlah orang terdampak vs potensi kerugian yang bisa terjadi.",
        example: "Contoh: 50 karyawan tidak bisa akses sistem (Cakupan) vs Sistem keamanan CCTV bermasalah (Risiko). Tergantung konteks perusahaan, biasanya Risiko sedikit lebih penting (nilai 3)."
    },
};

interface AHPCriterium {
    id?: string;
    name: string;
    weight: number;
    description?: string;
}

const DEFAULT_CRITERIA: AHPCriterium[] = [
    { name: "Urgensi", weight: 0, description: "Seberapa mendesak masalah ini perlu diselesaikan?" },
    { name: "Dampak", weight: 0, description: "Seberapa besar dampak masalah terhadap operasional?" },
    { name: "Kompleksitas", weight: 0, description: "Seberapa sulit masalah ini untuk diselesaikan?" },
    { name: "Cakupan", weight: 0, description: "Berapa banyak user/sistem yang terdampak?" },
    { name: "Risiko", weight: 0, description: "Seberapa besar risiko jika tidak segera ditangani?" },
];

export default function AHPSettingsPage() {
    const [criteria, setCriteria] = useState<AHPCriterium[]>([]);
    const [matrix, setMatrix] = useState<number[][]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [consistencyRatio, setConsistencyRatio] = useState<number | null>(null);
    const [weights, setWeights] = useState<number[]>([]);
    const [activeStep, setActiveStep] = useState(1);
    const [calculated, setCalculated] = useState(false);

    useEffect(() => { fetchCriteria(); }, []);

    useEffect(() => {
        if (criteria.length > 0 && matrix.length !== criteria.length) {
            const n = criteria.length;
            const newMatrix = Array(n).fill(0).map((_, i) =>
                Array(n).fill(0).map((_, j) => (i === j ? 1 : 1))
            );
            setMatrix(newMatrix);
            setConsistencyRatio(null);
            setCalculated(false);
        }
    }, [criteria.length]);

    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ahp/criteria');
            if (res.ok) {
                const data = await res.json();
                setCriteria(data.length > 0 ? data : DEFAULT_CRITERIA);
            }
        } catch {
            toast.error("Gagal memuat kriteria AHP");
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = (row: number, col: number, val: number) => {
        const newMatrix = matrix.map(r => [...r]);
        newMatrix[row][col] = val;
        newMatrix[col][row] = 1 / val;
        setMatrix(newMatrix);
        setCalculated(false);
        setConsistencyRatio(null);
    };

    const addCriteria = () => {
        if (criteria.length >= 5) {
            toast.error("Maksimal 5 kriteria diizinkan");
            return;
        }
        setCriteria([...criteria, { name: `Kriteria ${criteria.length + 1}`, weight: 0, description: "" }]);
    };

    const removeCriteria = (index: number) => {
        if (criteria.length <= 2) {
            toast.error("Minimal 2 kriteria diperlukan");
            return;
        }
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const calculateAHP = () => {
        const n = criteria.length;
        const colSums = Array(n).fill(0);
        for (let j = 0; j < n; j++)
            for (let i = 0; i < n; i++)
                colSums[j] += matrix[i][j];

        const normalized = matrix.map(row => row.map((val, j) => val / colSums[j]));
        const w = normalized.map(row => row.reduce((a, b) => a + b, 0) / n);
        setWeights(w);

        let lambda = 0;
        for (let j = 0; j < n; j++) lambda += colSums[j] * w[j];

        const ci = (lambda - n) / (n - 1);
        const ri = RI[Math.min(n - 1, 9)] || 1.49;
        const cr = n > 2 ? ci / ri : 0;
        setConsistencyRatio(cr);
        setCalculated(true);

        const newCriteria = criteria.map((c, i) => ({ ...c, weight: w[i] }));
        setCriteria(newCriteria);

        if (cr > 0.1) {
            toast.warning(`CR = ${cr.toFixed(3)} — Perbandingan kurang konsisten, harap revisi.`);
        } else {
            toast.success(`CR = ${cr.toFixed(3)} — Konsisten! Bobot siap disimpan.`);
            setActiveStep(3);
        }
    };

    const handleSave = async () => {
        if (!calculated) {
            toast.error("Harap hitung bobot terlebih dahulu");
            return;
        }
        if (consistencyRatio !== null && consistencyRatio > 0.1) {
            if (!confirm("CR > 0.1 (tidak konsisten). Tetap simpan?")) return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/ahp/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criteria })
            });
            if (res.ok) toast.success("Konfigurasi AHP berhasil disimpan!");
            else throw new Error();
        } catch {
            toast.error("Gagal menyimpan konfigurasi");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Memuat konfigurasi AHP...</p>
            </div>
        </div>
    );

    const steps = [
        { num: 1, icon: ListChecks, label: "Tentukan Kriteria", desc: "Daftar kriteria penilaian tiket" },
        { num: 2, icon: Calculator, label: "Perbandingan & Hitung", desc: "Bandingkan kepentingan antar kriteria" },
        { num: 3, icon: CheckCircle2, label: "Simpan Hasil", desc: "Bobot siap diterapkan ke sistem" },
    ];

    return (
        <div className="min-h-screen bg-background/50">
            {/* Header */}
            <div className="bg-card border-b border-border px-6 py-5 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Konfigurasi AHP — Penentuan Bobot Prioritas Tiket
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Analytical Hierarchy Process (AHP) membantu sistem menentukan prioritas penyelesaian tiket secara objektif berdasarkan bobot kriteria yang Anda tetapkan.
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={fetchCriteria}>
                            <RefreshCw className="w-4 h-4 mr-1" /> Reset
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

                {/* Step Indicator */}
                <div className="grid grid-cols-3 gap-3">
                    {steps.map((s) => {
                        const Icon = s.icon;
                        const isActive = activeStep === s.num;
                        const isDone = activeStep > s.num;
                        return (
                            <button key={s.num} onClick={() => setActiveStep(s.num)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                                    ${isActive ? "border-primary bg-primary/5" : isDone ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-border bg-card opacity-60"}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                    ${isActive ? "bg-primary text-white" : isDone ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{s.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Panduan Singkat */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                    <BookOpen className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">📌 Cara Penggunaan AHP</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li><strong>Langkah 1:</strong> Tentukan hingga 5 kriteria penilaian tiket (sudah ada 5 kriteria default).</li>
                            <li><strong>Langkah 2:</strong> Bandingkan setiap pasang kriteria — mana yang lebih penting dan seberapa besar nilainya (skala 1–9).</li>
                            <li><strong>Langkah 3:</strong> Klik "Hitung Bobot", pastikan CR &lt; 0.1 (konsisten), lalu simpan.</li>
                        </ol>
                    </div>
                </div>

                {/* STEP 1 - Kriteria */}
                {activeStep === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-primary" />
                                Langkah 1: Tentukan Kriteria Penilaian
                            </CardTitle>
                            <CardDescription>
                                Masukkan nama kriteria yang akan digunakan sistem untuk menilai prioritas tiket. Maksimal 5 kriteria.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {criteria.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                                    <div className="flex-1 space-y-1">
                                        <Input
                                            value={c.name}
                                            onChange={(e) => {
                                                const newC = [...criteria];
                                                newC[idx].name = e.target.value;
                                                setCriteria(newC);
                                            }}
                                            placeholder={`Nama Kriteria ${idx + 1}`}
                                            className="h-9 font-semibold"
                                        />
                                        <Input
                                            value={c.description || ""}
                                            onChange={(e) => {
                                                const newC = [...criteria];
                                                newC[idx].description = e.target.value;
                                                setCriteria(newC);
                                            }}
                                            placeholder="Deskripsi singkat kriteria ini (opsional)"
                                            className="h-8 text-xs text-muted-foreground"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeCriteria(idx)} className="text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button variant="outline" className="w-full border-dashed border-2 mt-2" onClick={addCriteria} disabled={criteria.length >= 5}>
                                <Plus className="w-4 h-4 mr-2" />
                                {criteria.length >= 5 ? "Maks. 5 Kriteria" : `Tambah Kriteria (${criteria.length}/5)`}
                            </Button>

                            <Button className="w-full mt-4" onClick={() => setActiveStep(2)}>
                                Lanjut ke Perbandingan →
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* STEP 2 - Perbandingan */}
                {activeStep === 2 && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-primary" />
                                    Langkah 2: Perbandingan Berpasangan
                                </CardTitle>
                                <CardDescription>
                                    Untuk setiap pasang kriteria, pilih <strong>mana yang lebih penting</strong> dan <strong>seberapa besar</strong> perbedaannya menggunakan skala 1–9.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {/* Skala Referensi */}
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Referensi Skala Saaty (1–9)</p>
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-1">
                                        {[1, 3, 5, 7, 9].map(val => (
                                            <div key={val} className="text-center p-2 bg-muted/40 rounded-lg border">
                                                <div className="text-lg font-black text-primary">{val}</div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">{SCALE_LABELS[val]}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Nilai genap (2,4,6,8) berada di antara dua kategori di atas.</p>
                                </div>

                                {/* Pair Comparisons */}
                                <div className="space-y-4">
                                    {criteria.flatMap((rowC, rowIndex) =>
                                        criteria.map((colC, colIndex) => {
                                            if (rowIndex >= colIndex) return null;
                                            const currentVal = matrix[rowIndex]?.[colIndex] || 1;
                                            // Determine direction: > 1 means rowC dominates, < 1 means colC dominates
                                            let displayVal: number;
                                            let dominant: 'left' | 'equal' | 'right';
                                            if (currentVal > 1) { displayVal = Math.round(currentVal); dominant = 'left'; }
                                            else if (currentVal < 1) { displayVal = Math.round(1 / currentVal); dominant = 'right'; }
                                            else { displayVal = 1; dominant = 'equal'; }

                                            return (
                                                <div key={`${rowIndex}-${colIndex}`} className="p-4 border rounded-xl bg-card space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className={`font-semibold px-3 py-1.5 rounded-lg flex-1 text-center ${dominant === 'left' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                                                            {rowC.name}
                                                        </span>
                                                        <span className="mx-3 text-xs font-bold text-muted-foreground">vs</span>
                                                        <span className={`font-semibold px-3 py-1.5 rounded-lg flex-1 text-center ${dominant === 'right' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                                                            {colC.name}
                                                        </span>
                                                    </div>

                                                    {/* Panduan kontekstual */}
                                                    {(() => {
                                                        const key1 = `${rowC.name}-${colC.name}`;
                                                        const key2 = `${colC.name}-${rowC.name}`;
                                                        const guide = PAIR_GUIDANCE[key1] || PAIR_GUIDANCE[key2];
                                                        if (!guide) return null;
                                                        return (
                                                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-1">
                                                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">💡 {guide.tip}</p>
                                                                <p className="text-[11px] text-amber-700 dark:text-amber-400">{guide.example}</p>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Which is dominant? */}
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] text-center text-muted-foreground font-medium">👉 Menurut Anda, mana yang lebih penting untuk menentukan prioritas tiket?</p>
                                                        <div className="flex gap-2 justify-center text-xs flex-wrap">
                                                            <button onClick={() => handleMatrixChange(rowIndex, colIndex, dominant === 'left' ? displayVal : 3)}
                                                                className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'left' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                                                                ← {rowC.name} lebih penting
                                                            </button>
                                                            <button onClick={() => handleMatrixChange(rowIndex, colIndex, 1)}
                                                                className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'equal' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                                                                Sama Penting
                                                            </button>
                                                            <button onClick={() => handleMatrixChange(rowIndex, colIndex, dominant === 'right' ? (1 / displayVal) : (1 / 3))}
                                                                className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'right' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                                                                {colC.name} lebih penting →
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Scale slider */}
                                                    {dominant !== 'equal' && (
                                                        <div className="space-y-1 px-2">
                                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                                <span>Sedikit (2)</span>
                                                                <span className="font-bold text-primary">{SCALE_LABELS[displayVal] || `Nilai ${displayVal}`} — Skala {displayVal}</span>
                                                                <span>Mutlak (9)</span>
                                                            </div>
                                                            <input type="range" min="1" max="9" step="1" value={displayVal}
                                                                onChange={(e) => {
                                                                    const v = parseInt(e.target.value);
                                                                    if (dominant === 'left') handleMatrixChange(rowIndex, colIndex, v);
                                                                    else handleMatrixChange(rowIndex, colIndex, 1 / v);
                                                                }}
                                                                className="w-full accent-primary" />
                                                        </div>
                                                    )}

                                                    {/* Numeric info box */}
                                                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg border border-border text-xs mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">Nilai Matriks:</span>
                                                            <span className="font-mono font-bold text-foreground">
                                                                {dominant === 'left' ? displayVal : dominant === 'right' ? `1/${displayVal}` : '1'}
                                                            </span>
                                                            <span className="text-muted-foreground">≈</span>
                                                            <span className="font-mono text-muted-foreground">{currentVal.toFixed(4)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-muted-foreground">Kebalikan:</span>
                                                            <span className="font-mono font-bold text-muted-foreground">{(1/currentVal).toFixed(4)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {/* Ringkasan Matriks */}
                                {matrix.length === criteria.length && criteria.length > 0 && (
                                    <div className="mt-4 border rounded-xl overflow-hidden">
                                        <div className="px-4 py-2 bg-muted/60 border-b flex items-center gap-2">
                                            <Info className="w-4 h-4 text-primary" />
                                            <p className="text-xs font-semibold">Ringkasan Matriks Perbandingan (Nilai Numerik)</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-muted/40">
                                                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r">Kriteria</th>
                                                        {criteria.map((c, i) => (
                                                            <th key={i} className="px-3 py-2 text-center font-semibold border-r last:border-r-0">{c.name}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {criteria.map((rowC, rowIdx) => (
                                                        <tr key={rowIdx} className="border-t hover:bg-muted/20">
                                                            <td className="px-3 py-2 font-semibold border-r bg-muted/20">{rowC.name}</td>
                                                            {criteria.map((_, colIdx) => {
                                                                const val = matrix[rowIdx]?.[colIdx] || 1;
                                                                const isIdentity = rowIdx === colIdx;
                                                                const isFraction = val < 1;
                                                                return (
                                                                    <td key={colIdx} className={`px-3 py-2 text-center font-mono border-r last:border-r-0 ${isIdentity ? 'bg-primary/10 font-bold text-primary' : isFraction ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                                        {isIdentity ? '1' : isFraction ? `1/${Math.round(1/val)}` : Math.round(val)}
                                                                        <div className="text-[9px] text-muted-foreground font-normal">{val.toFixed(3)}</div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="px-4 py-2 bg-muted/20 border-t flex gap-4 text-[10px] text-muted-foreground">
                                            <span><span className="text-blue-600 font-bold">Biru</span> = lebih penting (nilai &gt; 1)</span>
                                            <span><span className="text-orange-500 font-bold">Oranye</span> = kurang penting (1/n)</span>
                                            <span><span className="text-primary font-bold">Diagonal</span> = sama dengan dirinya (= 1)</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 mt-4">
                                    <Button variant="outline" onClick={() => setActiveStep(1)} className="flex-1">← Kembali</Button>
                                    <Button onClick={calculateAHP} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                        <Calculator className="w-4 h-4 mr-2" /> Hitung Bobot AHP
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Hasil Sementara */}
                        {calculated && (
                            <Card className={`border-2 ${consistencyRatio !== null && consistencyRatio <= 0.1 ? 'border-green-500' : 'border-red-500'}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {consistencyRatio !== null && consistencyRatio <= 0.1
                                            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            : <AlertTriangle className="w-5 h-5 text-red-600" />}
                                        Hasil Perhitungan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {criteria.map((c, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-sm font-medium w-28 shrink-0">{c.name}</span>
                                                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(weights[i] * 100).toFixed(1)}%` }} />
                                                </div>
                                                <span className="text-sm font-bold w-12 text-right">{(weights[i] * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`flex items-center gap-3 p-3 rounded-lg ${consistencyRatio !== null && consistencyRatio <= 0.1
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                                        <Info className={`w-5 h-5 shrink-0 ${consistencyRatio !== null && consistencyRatio <= 0.1 ? 'text-green-600' : 'text-red-600'}`} />
                                        <div>
                                            <p className="text-sm font-bold">Consistency Ratio (CR): {consistencyRatio?.toFixed(4)}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {consistencyRatio !== null && consistencyRatio <= 0.1
                                                    ? "✅ Konsisten! CR < 0.1 — Bobot valid dan siap digunakan."
                                                    : "⚠️ Tidak Konsisten! CR > 0.1 — Harap revisi perbandingan Anda."}
                                            </p>
                                        </div>
                                    </div>

                                    {consistencyRatio !== null && consistencyRatio <= 0.1 && (
                                        <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
                                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Simpan Konfigurasi AHP
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* STEP 3 - Selesai */}
                {activeStep === 3 && (
                    <Card className="border-2 border-green-500">
                        <CardContent className="py-10 text-center space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                            <h2 className="text-xl font-bold">Konfigurasi AHP Siap Disimpan!</h2>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Consistency Ratio sudah valid (CR &lt; 0.1). Bobot kriteria berikut akan diterapkan sistem untuk menentukan prioritas tiket:
                            </p>
                            <div className="max-w-xs mx-auto space-y-2 text-left mt-4">
                                {criteria.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-sm font-medium w-28 shrink-0">{c.name}</span>
                                        <div className="flex-1 bg-muted rounded-full h-3">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(c.weight * 100).toFixed(1)}%` }} />
                                        </div>
                                        <span className="text-sm font-bold">{(c.weight * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 justify-center mt-4">
                                <Button variant="outline" onClick={() => setActiveStep(2)}>← Ubah Perbandingan</Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Simpan Sekarang
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
