"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeftRight, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const SHIFTS = ["PAGI", "SIANG", "MALAM"];

const shiftBadge = (shift: string) => {
    if (shift === "PAGI") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">🌅 Pagi (06:00-15:00)</Badge>;
    if (shift === "SIANG") return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">☀️ Siang (13:30-22:30)</Badge>;
    if (shift === "MALAM") return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">🌙 Malam (21:30-06:30)</Badge>;
    return null;
};

const statusBadge = (status: string) => {
    if (status === "PENDING") return <Badge variant="outline" className="text-yellow-600 border-yellow-400">⏳ Menunggu</Badge>;
    if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700">✅ Disetujui</Badge>;
    if (status === "REJECTED") return <Badge className="bg-red-100 text-red-700">❌ Ditolak</Badge>;
};

export default function ShiftSwapPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [agentNames, setAgentNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        requesterName: "",
        requesterShift: "",
        requesterDate: "",
        targetName: "",
        targetShift: "",
        targetDate: "",
        reason: "",
    });

    const fetchRequests = async () => {
        const res = await fetch("/api/schedule/swap");
        if (res.ok) {
            const data = await res.json();
            setRequests(data);
        }
        setLoading(false);
    };

    const fetchAgents = async () => {
        const res = await fetch("/api/schedule/agents");
        if (res.ok) {
            const data = await res.json();
            setAgentNames(data);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchAgents();
    }, []);

    const handleSubmit = async () => {
        if (!form.requesterName || !form.requesterShift || !form.requesterDate || !form.targetName || !form.targetShift || !form.targetDate) {
            toast.error("Semua field wajib diisi");
            return;
        }
        setSubmitting(true);
        const res = await fetch("/api/schedule/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(data.message);
            setForm({ requesterName: "", requesterShift: "", requesterDate: "", targetName: "", targetShift: "", targetDate: "", reason: "" });
            fetchRequests();
        } else {
            toast.error(data.error);
        }
        setSubmitting(false);
    };

    const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
        const res = await fetch(`/api/schedule/swap/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(data.message);
            fetchRequests();
        } else {
            toast.error(data.error);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 min-h-screen">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                    <ArrowLeftRight className="w-8 h-8 text-blue-500" />
                    Tukar Shift
                </h1>
                <p className="text-muted-foreground mt-1">Ajukan permintaan tukar jadwal shift antar petugas IT Support.</p>
            </div>

            {/* Request Form */}
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Ajukan Tukar Shift Baru</CardTitle>
                    <CardDescription>Pilih shift Anda dan shift rekan yang ingin diajak tukar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column: Requester */}
                        <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                            <p className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2"><User className="w-4 h-4" />Petugas yang Mengajukan (Saya)</p>
                            <div>
                                <Label>Nama Saya</Label>
                                <Select value={form.requesterName} onValueChange={v => setForm(f => ({ ...f, requesterName: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Pilih nama Anda..." /></SelectTrigger>
                                    <SelectContent>
                                        {agentNames.map(name => (
                                            <SelectItem key={name} value={name}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Shift Saya (Asli)</Label>
                                <Select value={form.requesterShift} onValueChange={v => setForm(f => ({ ...f, requesterShift: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Pilih shift..." /></SelectTrigger>
                                    <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Tanggal Shift Saya</Label>
                                <Input type="date" value={form.requesterDate} onChange={e => setForm(f => ({ ...f, requesterDate: e.target.value }))} />
                            </div>
                        </div>

                        {/* Column: Target */}
                        <div className="space-y-3 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
                            <p className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" />Rekan yang Diajak Tukar</p>
                            <div>
                                <Label>Nama Rekan</Label>
                                <Select value={form.targetName} onValueChange={v => setForm(f => ({ ...f, targetName: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Pilih rekan..." /></SelectTrigger>
                                    <SelectContent>
                                        {agentNames
                                            .filter(name => name !== form.requesterName)
                                            .map(name => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Shift Rekan (Asli)</Label>
                                <Select value={form.targetShift} onValueChange={v => setForm(f => ({ ...f, targetShift: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Pilih shift..." /></SelectTrigger>
                                    <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Tanggal Shift Rekan</Label>
                                <Input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Alasan Tukar (opsional)</Label>
                        <Textarea placeholder="Contoh: Ada keperluan keluarga..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
                    </div>

                    <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <ArrowLeftRight className="w-4 h-4" />
                        {submitting ? "Mengajukan..." : "Ajukan Permintaan Tukar Shift"}
                    </Button>
                </CardContent>
            </Card>

            {/* List of Requests */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Daftar Permintaan Tukar Shift</h2>
                {loading ? (
                    <div className="text-muted-foreground text-center py-10">Memuat data...</div>
                ) : requests.length === 0 ? (
                    <div className="text-muted-foreground text-center py-10 border border-dashed rounded-xl">Belum ada permintaan tukar shift.</div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((r) => (
                            <Card key={r.id} className="border-border shadow-sm">
                                <CardContent className="pt-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {statusBadge(r.status)}
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(r.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 items-center">
                                                <div className="text-sm">
                                                    <p className="font-bold text-foreground">{r.requesterName}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {shiftBadge(r.requesterShift)}
                                                        <span className="text-xs text-muted-foreground">{format(new Date(r.requesterDate), "dd MMM yyyy")}</span>
                                                    </div>
                                                </div>
                                                <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                                                <div className="text-sm">
                                                    <p className="font-bold text-foreground">{r.targetName}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {shiftBadge(r.targetShift)}
                                                        <span className="text-xs text-muted-foreground">{format(new Date(r.targetDate), "dd MMM yyyy")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {r.reason && <p className="text-xs text-muted-foreground italic">Alasan: {r.reason}</p>}
                                            {r.approvedBy && (
                                                <p className="text-xs text-muted-foreground">
                                                    {r.status === "APPROVED" ? "✅ Disetujui" : "❌ Ditolak"} oleh <strong>{r.approvedBy}</strong> pada {format(new Date(r.approvedAt), "dd MMM yyyy, HH:mm", { locale: id })}
                                                </p>
                                            )}
                                        </div>
                                        {r.status === "PENDING" && (
                                            <div className="flex gap-2 shrink-0">
                                                <Button size="sm" onClick={() => handleAction(r.id, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Setujui
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "REJECTED")} className="text-red-600 border-red-300 hover:bg-red-50 gap-1">
                                                    <XCircle className="w-4 h-4" /> Tolak
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
