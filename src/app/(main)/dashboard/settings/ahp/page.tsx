"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, RefreshCw, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

interface AHPCriterium {
    id?: string;
    name: string;
    weight: number;
}

export default function AHPSettingsPage() {
    const [criteria, setCriteria] = useState<AHPCriterium[]>([]);
    const [matrix, setMatrix] = useState<number[][]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [consistencyRatio, setConsistencyRatio] = useState<number | null>(null);
    const [lambdaMax, setLambdaMax] = useState<number | null>(null);

    // Initial load
    useEffect(() => {
        fetchCriteria();
    }, []);

    // Initialize matrix when criteria change size (not content, to preserve existing comparisons if possible, but resizing breaks it usually)
    // For simplicity, we'll reset matrix if criteria count changes
    useEffect(() => {
        if (criteria.length > 0) {
            // Check if matrix dimensions match
            if (matrix.length !== criteria.length) {
                const newMatrix = Array(criteria.length).fill(0).map((_, i) =>
                    Array(criteria.length).fill(0).map((_, j) => (i === j ? 1 : 0))
                );
                setMatrix(newMatrix);
            }
        }
    }, [criteria.length]);

    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ahp/criteria');
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setCriteria(data);
                    // Ideally we'd try to reconstruct matrix, but we only have weights.
                    // So we start with fresh identity matrix, or user defines it.
                    // For now, let's just let user input comparisons.
                } else {
                    // Default criteria
                    setCriteria([
                        { name: "Urgency", weight: 0 },
                        { name: "Impact", weight: 0 },
                        { name: "Complexity", weight: 0 },
                    ]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error("Gagal memuat kriteria AHP");
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = (row: number, col: number, value: string) => {
        const val = parseFloat(value);
        if (isNaN(val) || val <= 0) return;

        const newMatrix = [...matrix];
        newMatrix[row][col] = val;
        newMatrix[col][row] = 1 / val;
        setMatrix(newMatrix);
        setConsistencyRatio(null); // Reset calculation results until recalculated
    };

    const addCriteria = () => {
        setCriteria([...criteria, { name: `Criteria ${criteria.length + 1}`, weight: 0 }]);
    };

    const removeCriteria = (index: number) => {
        if (criteria.length <= 2) {
            toast.error("Minimal harus ada 2 kriteria untuk perbandingan AHP");
            return;
        }
        const newCriteria = criteria.filter((_, i) => i !== index);
        setCriteria(newCriteria);
        // Matrix will reset via useEffect
    };

    const updateCriteriaName = (index: number, name: string) => {
        const newCriteria = [...criteria];
        newCriteria[index].name = name;
        setCriteria(newCriteria);
    };

    const calculateAHP = () => {
        setCalculating(true);
        try {
            const n = criteria.length;

            // 1. Sum of each column
            const colSums = Array(n).fill(0);
            for (let j = 0; j < n; j++) {
                for (let i = 0; i < n; i++) {
                    colSums[j] += matrix[i][j];
                }
            }

            // 2. Normalize Matrix
            const normalizedMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    normalizedMatrix[i][j] = matrix[i][j] / colSums[j];
                }
            }

            // 3. Calculate Weights (Average of rows) & Lambda Max
            const weights = Array(n).fill(0);
            const weightedSumVector = Array(n).fill(0);

            for (let i = 0; i < n; i++) {
                let sumRow = 0;
                for (let j = 0; j < n; j++) {
                    sumRow += normalizedMatrix[i][j];
                }
                weights[i] = sumRow / n;
            }

            // Calculate Lambda Max for consistency check
            // Lambda Max = Sum( (Matrix * Weights) / Weights ) / n ?? 
            // Better: Lambda Max = Sum (ColSum_j * Weight_j)
            let lambda = 0;
            for (let j = 0; j < n; j++) {
                lambda += colSums[j] * weights[j];
            }
            setLambdaMax(lambda);

            // 4. Calculate CI and CR
            const ci = (lambda - n) / (n - 1);
            const ri = RI[Math.min(n - 1, 9)] || 1.49; // Default to last if > 10
            const cr = n > 2 ? ci / ri : 0; // CR is 0 for n=1,2 basically consistent

            setConsistencyRatio(cr);

            // Update state with new weights
            const newCriteria = criteria.map((c, i) => ({
                ...c,
                weight: weights[i]
            }));
            setCriteria(newCriteria);

            if (cr > 0.1) {
                toast.warning(`Consistency Ratio (CR) is ${cr.toFixed(3)}. This is > 0.10, please revise your judgments.`);
            } else {
                toast.success("Perhitungan selesai. Konsistensi data baik.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan kalkulasi");
        } finally {
            setCalculating(false);
        }
    };

    const handleSave = async () => {
        if (consistencyRatio !== null && consistencyRatio > 0.1) {
            // Maybe allow saving anyway but warn?
            // Let's block for now to enforce good AHP
            if (!confirm("Consistency Ratio tidak ideal (> 0.1). Apakah Anda yakin ingin menyimpan?")) {
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch('/api/ahp/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ criteria })
            });

            if (res.ok) {
                toast.success("Pengaturan AHP berhasil disimpan");
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-background/50">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 md:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Pengaturan AHP</h1>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Konfigurasi bobot kriteria menggunakan metode Analytical Hierarchy Process</p>
                </div>
            </div>

            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Criteria Management */}
                    <div className="lg:col-start-1 lg:col-end-2 order-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Definisi Kriteria</CardTitle>
                                <CardDescription>Tentukan kriteria yang akan digunakan untuk penilaian tiket.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {criteria.map((c, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            value={c.name}
                                            onChange={(e) => updateCriteriaName(idx, e.target.value)}
                                            placeholder={`Kriteria ${idx + 1}`}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => removeCriteria(idx)} className="text-red-500 hover:text-red-700 dark:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full dashed border-2" onClick={addCriteria}>
                                    <Plus className="w-4 h-4 mr-2" /> Tambah Kriteria
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 2. Pairwise Matrix */}
                    <div className="lg:col-start-2 lg:col-end-4 lg:row-span-2 order-2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>2. Matriks Perbandingan Berpasangan</CardTitle>
                                <CardDescription>
                                    Bandingkan tingkat kepentingan antar kriteria.
                                    <br />Skala: 1 (Sama), 3 (Sedikit Lebih), 5 (Lebih), 7 (Sangat), 9 (Mutlak).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {matrix.length === criteria.length && criteria.length > 0 && (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[100px] bg-muted">Kriteria</TableHead>
                                                    {criteria.map((c, i) => (
                                                        <TableHead key={i} className="text-center bg-muted min-w-[80px]">{c.name}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {criteria.map((rowC, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        <TableCell className="font-medium bg-muted">{rowC.name}</TableCell>
                                                        {criteria.map((colC, colIndex) => {
                                                            const isDiagonal = rowIndex === colIndex;
                                                            const isLower = rowIndex > colIndex;

                                                            // Safe access
                                                            const cellValue = matrix[rowIndex]?.[colIndex] || 1;

                                                            return (
                                                                <TableCell key={colIndex} className="p-1">
                                                                    {isDiagonal ? (
                                                                        <div className="w-full text-center py-2 bg-muted text-muted-foreground rounded font-medium">1</div>
                                                                    ) : isLower ? (
                                                                        <div className="w-full text-center py-2 bg-muted text-muted-foreground rounded text-sm">
                                                                            {cellValue.toFixed(2)}
                                                                        </div>
                                                                    ) : (
                                                                        <select
                                                                            className="w-full p-2 border rounded-md text-sm cursor-pointer hover:border-blue-400 focus:border-blue-500 outline-none"
                                                                            value={cellValue >= 1 ? cellValue : (cellValue === 0 ? 1 : -1 / cellValue)}
                                                                            onChange={(e) => handleMatrixChange(rowIndex, colIndex, e.target.value)}
                                                                        >
                                                                            <option value="1">1 - Sama Penting</option>
                                                                            <option value="2">2 - Mendekati Sedikit Lebih</option>
                                                                            <option value="3">3 - Sedikit Lebih Penting</option>
                                                                            <option value="4">4 - Mendekati Lebih Penting</option>
                                                                            <option value="5">5 - Lebih Penting</option>
                                                                            <option value="6">6 - Mendekati Sangat Penting</option>
                                                                            <option value="7">7 - Sangat Penting</option>
                                                                            <option value="8">8 - Mendekati Mutlak</option>
                                                                            <option value="9">9 - Mutlak Penting</option>

                                                                            <option disabled>--- Kebalikan ---</option>
                                                                            <option value="0.5">1/2 - Sedikit Kurang Penting</option>
                                                                            <option value="0.333333">1/3 - Kurang Penting</option>
                                                                            <option value="0.2">1/5 - Lebih Kurang Penting</option>
                                                                            <option value="0.142857">1/7 - Sangat Kurang Penting</option>
                                                                            <option value="0.111111">1/9 - Mutlak Kurang Penting</option>
                                                                        </select>
                                                                    )}
                                                                </TableCell>
                                                            )
                                                        })}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button size="lg" onClick={calculateAHP} className="bg-blue-600 hover:bg-blue-700">
                                        <RefreshCw className={`w-4 h-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
                                        Kalkulasi Bobot
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. Results Card */}
                    <div className="lg:col-start-1 lg:col-end-2 order-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>3. Hasil Bobot</CardTitle>
                                <CardDescription>Bobot kalkulasi dari perbandingan.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {criteria.map((c, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className="text-sm font-medium">{c.name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600" style={{ width: `${(c.weight * 100).toFixed(1)}%` }} />
                                                </div>
                                                <span className="text-sm font-bold">{(c.weight * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {consistencyRatio !== null && (
                                    <Alert className={`mt-6 ${consistencyRatio > 0.1 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                                        <Info className={`w-4 h-4 ${consistencyRatio > 0.1 ? 'text-red-600' : 'text-green-600'}`} />
                                        <AlertTitle className={`${consistencyRatio > 0.1 ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
                                            Consistency Ratio (CR): {consistencyRatio.toFixed(3)}
                                        </AlertTitle>
                                        <AlertDescription className="text-xs text-muted-foreground mt-1">
                                            {consistencyRatio <= 0.1
                                                ? "Matriks perbandingan KONSISTEN. Bobot valid untuk digunakan."
                                                : "Matriks TIDAK KONSISTEN (>0.1). Mohon perbaiki perbandingan Anda."}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button disabled={!consistencyRatio || saving} onClick={handleSave} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Simpan Konfigurasi
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div >
    );
}
