"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, RefreshCw, Plus, Trash2, CheckCircle2, AlertTriangle, Info, Calculator, ListChecks } from "lucide-react";
import { toast } from "sonner";

const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
const SCALE_LABELS: Record<number, string> = {
  1:"Sama Penting", 2:"Hampir Sedikit Lebih", 3:"Sedikit Lebih Penting",
  4:"Hampir Lebih Penting", 5:"Lebih Penting", 6:"Hampir Sangat Penting",
  7:"Sangat Penting", 8:"Hampir Mutlak", 9:"Mutlak Lebih Penting"
};

interface AHPCriterium { id?: string; name: string; weight: number; description?: string; }

const DEFAULT_CRITERIA: AHPCriterium[] = [
  { name:"Urgensi", weight:0, description:"Seberapa mendesak masalah ini? Nilai tinggi jika pekerjaan terhenti total dan membutuhkan penanganan segera." },
  { name:"Dampak", weight:0, description:"Seberapa besar efek masalah terhadap operasional toko/kantor? Nilai tinggi jika transaksi, pelayanan, atau sistem utama terganggu." },
  { name:"Kompleksitas", weight:0, description:"Seberapa rumit masalah ini untuk diselesaikan? Nilai tinggi jika memerlukan keahlian teknis khusus atau waktu penyelesaian lama." },
  { name:"Cakupan", weight:0, description:"Berapa banyak pengguna atau perangkat yang terdampak? Nilai tinggi jika seluruh toko, departemen, atau banyak karyawan ikut terganggu." },
  { name:"Risiko", weight:0, description:"Seberapa besar potensi kerugian jika masalah tidak segera ditangani? Nilai tinggi jika menyangkut keamanan data, kerugian finansial, atau gangguan berkepanjangan." },
];

export default function AHPSettingsPage() {
  const [criteria, setCriteria] = useState<AHPCriterium[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cr, setCr] = useState<number | null>(null);
  const [weights, setWeights] = useState<number[]>([]);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => { fetchCriteria(); }, []);

  useEffect(() => {
    if (criteria.length > 0 && matrix.length !== criteria.length) {
      setMatrix(Array(criteria.length).fill(0).map(() => Array(criteria.length).fill(1)));
      setCr(null);
      setCalculated(false);
    }
  }, [criteria.length]);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ahp/criteria');
      if (res.ok) { const d = await res.json(); setCriteria(d.length > 0 ? d : DEFAULT_CRITERIA); }
    } catch { toast.error("Gagal memuat kriteria"); } finally { setLoading(false); }
  };

  const handleMatrixChange = (r: number, c: number, v: number) => {
    const m = matrix.map(row => [...row]);
    m[r][c] = v; m[c][r] = 1 / v;
    setMatrix(m); setCalculated(false); setCr(null);
  };

  const addCriteria = () => {
    setCriteria([...criteria, { name: `Kriteria ${criteria.length + 1}`, weight: 0, description: "" }]);
  };

  const removeCriteria = (i: number) => {
    if (criteria.length <= 2) { toast.error("Minimal 2 kriteria"); return; }
    setCriteria(criteria.filter((_, idx) => idx !== i));
  };

  const calculateAHP = () => {
    const n = criteria.length;
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) colSums[j] += matrix[i][j];
    const norm = matrix.map(row => row.map((v, j) => v / colSums[j]));
    const w = norm.map(row => row.reduce((a, b) => a + b, 0) / n);
    setWeights(w);
    let lambda = 0;
    for (let j = 0; j < n; j++) lambda += colSums[j] * w[j];
    const ci = (lambda - n) / (n - 1);
    const ri = RI[Math.min(n - 1, 9)] || 1.49;
    const ratio = n > 2 ? ci / ri : 0;
    setCr(ratio); setCalculated(true);
    setCriteria(criteria.map((c, i) => ({ ...c, weight: w[i] })));
    if (ratio > 0.1) toast.warning(`CR=${ratio.toFixed(3)} — Kurang konsisten, harap revisi.`);
    else toast.success(`CR=${ratio.toFixed(3)} — Konsisten! Bobot siap disimpan.`);
  };

  const handleSave = async () => {
    if (!calculated) { toast.error("Hitung bobot terlebih dahulu"); return; }
    if (cr !== null && cr > 0.1 && !confirm("CR > 0.1 (tidak konsisten). Tetap simpan?")) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ahp/criteria', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ criteria })
      });
      if (res.ok) toast.success("Konfigurasi AHP berhasil disimpan!");
      else throw new Error();
    } catch { toast.error("Gagal menyimpan"); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Memuat konfigurasi AHP...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background/50">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Konfigurasi AHP — Penentuan Bobot Prioritas Tiket
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analytical Hierarchy Process membantu menentukan prioritas tiket secara objektif.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCriteria}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

        {/* ===== BAGIAN 1: TENTUKAN KRITERIA ===== */}
        <Card>
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="w-5 h-5 text-primary" /> Tentukan Kriteria
                </CardTitle>
                <CardDescription>Daftar kriteria penilaian tiket — maksimal 5 kriteria.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {criteria.map((c, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                <div className="flex-1 space-y-1">
                  <Input value={c.name}
                    onChange={e => { const n = [...criteria]; n[idx].name = e.target.value; setCriteria(n); }}
                    placeholder={`Nama Kriteria ${idx + 1}`} className="h-9 font-semibold" />
                  <Input value={c.description || ""}
                    onChange={e => { const n = [...criteria]; n[idx].description = e.target.value; setCriteria(n); }}
                    placeholder="Deskripsi singkat (opsional)" className="h-8 text-xs" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCriteria(idx)} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed border-2 mt-2" onClick={addCriteria}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kriteria
            </Button>
          </CardContent>
        </Card>

        {/* ===== BAGIAN 2: PERBANDINGAN & HITUNG ===== */}
        <Card>
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="w-5 h-5 text-primary" /> Perbandingan & Hitung
                </CardTitle>
                <CardDescription>Bandingkan kepentingan antar kriteria menggunakan skala 1–9 Saaty.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Referensi skala */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 7, 9].map(v => (
                <div key={v} className="text-center p-2 bg-muted/40 rounded-lg border">
                  <div className="text-lg font-black text-primary">{v}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{SCALE_LABELS[v]}</div>
                </div>
              ))}
            </div>

            {/* Pair comparisons */}
            <div className="space-y-4">
              {criteria.flatMap((rowC, r) => criteria.map((colC, c) => {
                if (r >= c) return null;
                const val = matrix[r]?.[c] || 1;
                let displayVal = 1, dominant: 'left' | 'equal' | 'right' = 'equal';
                if (val > 1) { displayVal = Math.round(val); dominant = 'left'; }
                else if (val < 1) { displayVal = Math.round(1 / val); dominant = 'right'; }

                return (
                  <div key={`${r}-${c}`} className="p-4 border border-border rounded-xl bg-card space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-semibold px-3 py-1.5 rounded-lg flex-1 text-center transition-colors ${dominant === 'left' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                        {rowC.name}
                      </span>
                      <span className="mx-3 text-xs font-bold text-muted-foreground">vs</span>
                      <span className={`font-semibold px-3 py-1.5 rounded-lg flex-1 text-center transition-colors ${dominant === 'right' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                        {colC.name}
                      </span>
                    </div>

                    <div className="flex gap-2 justify-center text-xs flex-wrap">
                      <button onClick={() => handleMatrixChange(r, c, dominant === 'left' ? displayVal : 3)}
                        className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'left' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                        ← {rowC.name} lebih penting
                      </button>
                      <button onClick={() => handleMatrixChange(r, c, 1)}
                        className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'equal' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                        Sama Penting
                      </button>
                      <button onClick={() => handleMatrixChange(r, c, dominant === 'right' ? (1 / displayVal) : (1 / 3))}
                        className={`px-3 py-1.5 rounded-full border font-medium transition-all ${dominant === 'right' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'}`}>
                        {colC.name} lebih penting →
                      </button>
                    </div>

                    {dominant !== 'equal' && (
                      <div className="px-2 space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Sedikit (2)</span>
                          <span className="font-bold text-primary">{SCALE_LABELS[displayVal] || `Nilai ${displayVal}`} — Skala {displayVal}</span>
                          <span>Mutlak (9)</span>
                        </div>
                        <input type="range" min="1" max="9" step="1" value={displayVal}
                          onChange={e => {
                            const v = parseInt(e.target.value);
                            handleMatrixChange(r, c, dominant === 'left' ? v : 1 / v);
                          }}
                          className="w-full accent-primary" />
                      </div>
                    )}

                    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg border text-xs">
                      <span className="text-muted-foreground">
                        Nilai Matriks: <strong className="text-foreground">{dominant === 'left' ? displayVal : dominant === 'right' ? `1/${displayVal}` : '1'}</strong>
                        {' '}≈ <span className="font-mono">{val.toFixed(4)}</span>
                      </span>
                      <span className="text-muted-foreground">Kebalikan: <span className="font-mono">{(1 / val).toFixed(4)}</span></span>
                    </div>
                  </div>
                );
              }))}
            </div>

            <Button onClick={calculateAHP} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
              <Calculator className="w-4 h-4 mr-2" /> Hitung Bobot AHP
            </Button>
          </CardContent>
        </Card>

        {/* ===== BAGIAN 3: SIMPAN HASIL ===== */}
        <Card className={`border-2 transition-colors ${calculated ? (cr !== null && cr <= 0.1 ? 'border-green-500' : 'border-red-400') : 'border-border'}`}>
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${calculated && cr !== null && cr <= 0.1 ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                {calculated && cr !== null && cr <= 0.1 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {calculated && cr !== null && cr <= 0.1
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <Info className="w-5 h-5 text-primary" />}
                  Simpan Hasil
                </CardTitle>
                <CardDescription>Bobot siap diterapkan ke sistem setelah perhitungan konsisten.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {!calculated ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Klik <strong>"Hitung Bobot AHP"</strong> di atas untuk melihat hasil perhitungan.</p>
              </div>
            ) : (
              <>
                {/* Bobot hasil */}
                <div className="space-y-3">
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-28 shrink-0">{c.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${cr !== null && cr <= 0.1 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${((weights[i] || 0) * 100).toFixed(1)}%` }} />
                      </div>
                      <span className="text-sm font-bold w-14 text-right">{((weights[i] || 0) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                {/* CR Status */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${cr !== null && cr <= 0.1 ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                  {cr !== null && cr <= 0.1
                    ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-bold">Consistency Ratio (CR): {cr?.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cr !== null && cr <= 0.1
                        ? "✅ Konsisten! CR < 0.1 — Bobot valid dan siap digunakan."
                        : "⚠️ Tidak Konsisten! CR > 0.1 — Harap revisi perbandingan di bagian 2."}
                    </p>
                  </div>
                </div>

                {/* Tombol simpan */}
                <Button onClick={handleSave} disabled={saving}
                  className={`w-full ${cr !== null && cr <= 0.1 ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {cr !== null && cr <= 0.1 ? 'Simpan Konfigurasi AHP' : 'Simpan Meski Tidak Konsisten'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
