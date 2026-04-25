"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Info, Target, AlertTriangle, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AHPCalculationSimulation() {
    const [criteria, setCriteria] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const res = await fetch('/api/ahp/criteria');
                if (res.ok) {
                    const data = await res.json();
                    setCriteria(data);
                    
                    // Set default score to 3 for all
                    const initScores: Record<string, number> = {};
                    data.forEach((c: any) => {
                        initScores[c.name] = 3;
                    });
                    setScores(initScores);
                }
            } catch (error) {
                console.error("Failed to load criteria");
            } finally {
                setLoading(false);
            }
        };
        fetchCriteria();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat data kriteria AHP...</div>;
    }

    if (criteria.length === 0) {
        return <div className="p-8 text-center text-red-500 font-medium">Kriteria AHP belum dikonfigurasi. Silakan atur Bobot Kriteria terlebih dahulu.</div>;
    }

    // Hitung Math Langsung
    let totalScoreRaw = 0;
    let totalWeight = 0;
    let maxUserScore = 0;

    criteria.forEach(c => {
        const userVal = scores[c.name] || 1;
        totalScoreRaw += c.weight * userVal;
        totalWeight += c.weight;
        if (userVal > maxUserScore) maxUserScore = userVal;
    });

    // Normalisasi jika bobot belum persis 1.0 (failsafe backend)
    let totalScore = totalScoreRaw;
    if (totalWeight > 0 && Math.abs(totalWeight - 1) > 0.1) {
        totalScore = totalScore / totalWeight;
    }

    let finalPriority = 'LOW';
    if (totalScore >= 3.8) finalPriority = 'CRITICAL';
    else if (totalScore >= 2.8) finalPriority = 'HIGH';
    else if (totalScore >= 1.5) finalPriority = 'MEDIUM';

    // Failsafe Logic matching API
    let failsafeTriggered = false;
    let originalPriority = finalPriority;
    
    if (maxUserScore >= 5) {
        if (finalPriority === 'LOW' || finalPriority === 'MEDIUM') {
            finalPriority = 'HIGH';
            failsafeTriggered = true;
        }
    } else if (maxUserScore >= 4) {
        if (finalPriority === 'LOW') {
            finalPriority = 'MEDIUM';
            failsafeTriggered = true;
        }
    }

    const priorityColors: Record<string, string> = {
        'LOW': 'bg-slate-100 text-slate-700 border-slate-300',
        'MEDIUM': 'bg-blue-100 text-blue-700 border-blue-300',
        'HIGH': 'bg-amber-100 text-amber-700 border-amber-300',
        'CRITICAL': 'bg-red-100 text-red-700 border-red-300'
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-primary" />
                    Simulasi & Detail Perhitungan AHP
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Halaman ini menjelaskan secara transparan bagaimana sistem mengolah masukan angka AHP dari pengguna menjadi sebuah status prioritas akhir tiket.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* KIRI: Input Simulasi dan Tabel Bobot */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-blue-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 border-b border-blue-100 px-6 py-4">
                            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" /> Bobot Kriteria Aktif
                            </h3>
                            <p className="text-xs text-blue-600/80 mt-1">Diambil dari database sistem (hasil konfigurasi IT Support).</p>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-xs">Kriteria</TableHead>
                                        <TableHead className="text-xs text-right">Bobot (W)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {criteria.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium text-sm">{c.name}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{(c.weight * 100).toFixed(1)}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-4 border-b border-slate-100">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                Masukan Kuesioner Pengguna
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Geser slider di bawah ini untuk mensimulasikan pilihan pengguna (SPV-Shop) pada saat membuat tiket baru.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            {criteria.map((c) => (
                                <div key={c.name} className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <Label className="text-slate-700 cursor-pointer">{c.name}</Label>
                                        <span className="bg-white text-blue-600 px-2 py-0.5 rounded shadow-sm border border-slate-200 text-xs text-mono">Nilai: {scores[c.name]}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="5" step="1"
                                        value={scores[c.name]}
                                        onChange={(e) => setScores({ ...scores, [c.name]: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                        <span>Rendah (1)</span>
                                        <span>Tinggi (5)</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* KANAN: Rumus dan Logika Kalkulasi */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-lg">Detail Penjabaran Rumus</CardTitle>
                            <CardDescription>Bagaimana masukan pengguna dikonversi menjadi Skor AHP Akhir.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            
                            {/* Langkah 1 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                                    <h4 className="font-semibold text-slate-800">Perkalian Bobot dengan Input</h4>
                                </div>
                                <div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-sm overflow-x-auto shadow-inner">
                                    <p className="text-blue-300 mb-2">/* Rumus: Skor = Σ (Bobot_Kriteria × Nilai_Input) */</p>
                                    <div className="space-y-1">
                                        {criteria.map((c, i) => (
                                            <div key={i}>
                                                <span className="text-slate-400">Skor {c.name.substring(0, 10).padEnd(10)} : </span> 
                                                ({c.weight.toFixed(4)}) × <span className="text-yellow-300">{scores[c.name]}</span> = 
                                                <span className="text-white font-bold ml-2">{(c.weight * scores[c.name]).toFixed(4)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center">
                                        <span className="text-slate-400 w-[140px]">Total Skor AHP : </span>
                                        <span className="text-xl font-black text-white">{totalScore.toFixed(3)}</span> 
                                        <span className="text-slate-500 text-xs ml-2">/ 5.000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Langkah 2 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                                    <h4 className="font-semibold text-slate-800">Evaluasi Skala Prioritas Utama (Threshold)</h4>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
                                    <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${totalScore < 1.5 ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400 font-bold' : 'border-slate-200 text-slate-400'}`}>
                                        <span className="text-xs mb-1">Skor &lt; 1.5</span>
                                        LOW
                                    </div>
                                    <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${totalScore >= 1.5 && totalScore < 2.8 ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400 font-bold' : 'border-slate-200 text-slate-400'}`}>
                                        <span className="text-xs mb-1">1.5 - 2.79</span>
                                        MEDIUM
                                    </div>
                                    <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${totalScore >= 2.8 && totalScore < 3.8 ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 font-bold' : 'border-slate-200 text-slate-400'}`}>
                                        <span className="text-xs mb-1">2.8 - 3.79</span>
                                        HIGH
                                    </div>
                                    <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${totalScore >= 3.8 ? 'bg-red-50 border-red-400 ring-2 ring-red-400 font-bold' : 'border-slate-200 text-slate-400'}`}>
                                        <span className="text-xs mb-1">&ge; 3.8</span>
                                        CRITICAL
                                    </div>
                                </div>
                            </div>

                            {/* Langkah 3 (Failsafe) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${failsafeTriggered ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>3</span>
                                    <h4 className="font-semibold text-slate-800">Sistem Keselamatan Darurat (Failsafe Override)</h4>
                                </div>
                                <div className={`p-4 rounded-xl border text-sm ${failsafeTriggered ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    <p className="mb-2">Sistem ini dilengkapi algoritma cerdas untuk mendeteksi anomali (Contoh: Dampak sangat parah [5], namun total bobot secara matematis tertekan ke "Low"). Logika penyelamatan otomatis:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs opacity-90 ml-1">
                                        <li>Jika terdapat <strong>satu saja</strong> input bernilai "5", prioritas tidak boleh lebih rendah dari HIGH.</li>
                                        <li>Jika terdapat input bernilai "4", prioritas tidak boleh lebih rendah dari MEDIUM.</li>
                                    </ul>
                                    
                                    {failsafeTriggered && (
                                        <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-start gap-2 text-amber-800 font-medium">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p>Failsafe <strong>Aktif!</strong> Nilai maksimum input Anda adalah {maxUserScore}. Prioritas matematis murni ({originalPriority}) telah dinaikkan secara paksa menjadi <strong>{finalPriority}</strong>.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Kesimpulan Akhir */}
                            <div className="mt-8">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                                        <Calculator className="w-32 h-32" />
                                    </div>
                                    
                                    <h4 className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-xs">Hasil Prediksi Sistem Tiket</h4>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-3xl font-black text-white">
                                                <span className="text-slate-400 text-2xl mr-2 font-mono">Skor:</span>
                                                {totalScore.toFixed(3)}
                                            </p>
                                        </div>
                                        <div className={`px-5 py-2.5 rounded-xl border-2 flex items-center gap-2 ${priorityColors[finalPriority]} font-black tracking-widest uppercase text-xl shadow-inner`}>
                                            <span>{finalPriority}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
