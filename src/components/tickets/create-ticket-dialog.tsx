"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSystemSettings } from "@/components/settings-provider";

interface CreateTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    defaultCategory?: string;
}

const DEPARTMENTS = [
    { value: "IT_SUPPORT", label: "IT Support" },
    { value: "SHOP_OPERATIONS", label: "Shop Operasional" }
];

const PRIORITIES = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
];

export function CreateTicketDialog({ open, onOpenChange, onSuccess, defaultCategory }: CreateTicketDialogProps) {
    const { data: session } = useSession();
    const { settings } = useSystemSettings();
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: defaultCategory || "IT_SUPPORT",
    });

    const [ahpCriteria, setAhpCriteria] = useState<{ id: string, name: string, weight: number, description?: string | null }[]>([]);
    const [ahpScores, setAhpScores] = useState<Record<string, number>>({});

    const isSupervisor = session?.user?.role === "SUPERVISOR";

    useEffect(() => {
        if (open) {
            setFormData(prev => ({
                ...prev,
                category: defaultCategory || prev.category,
                priority: settings?.ticket?.defaultPriority || "MEDIUM",
            }));
        }
    }, [open, defaultCategory, settings?.ticket?.defaultPriority]);

    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                console.log('Fetching AHP criteria...');
                const res = await fetch('/api/ahp/criteria');
                if (res.ok) {
                    const data = await res.json();
                    console.log('AHP Criteria loaded:', data);
                    setAhpCriteria(data);
                    const initialScores: Record<string, number> = {};
                    data.forEach((c: any) => initialScores[c.name] = 3); // Default to 3 (Medium)
                    setAhpScores(initialScores);
                } else {
                    console.error('Failed to fetch AHP criteria:', res.status);
                }
            } catch (error) {
                console.error("Failed to load AHP criteria", error);
            }
        };
        if (open) {
            fetchCriteria();
        }
    }, [open]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const maxAttachmentSizeMB = settings?.ticket?.maxAttachmentSize || 5;
        const maxSizeBytes = maxAttachmentSizeMB * 1024 * 1024;
        const allowedTypesStr = settings?.ticket?.allowedFileTypes || "jpg,jpeg,png,pdf,doc";
        const allowedExtensions = allowedTypesStr.split(',').map((t: string) => t.trim().toLowerCase());

        const validFiles = Array.from(files).filter(file => {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            if (file.size > maxSizeBytes) {
                toast.error(`File ${file.name} melebihi batas ukuran (${maxAttachmentSizeMB}MB)`);
                return false;
            }
            if (!allowedExtensions.includes(ext) && allowedTypesStr !== '*') {
                toast.error(`Format file ${file.name} tidak diizinkan. (${allowedTypesStr})`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = validFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.url;
                } else {
                    throw new Error('Upload failed');
                }
            });

            const urls = await Promise.all(uploadPromises);
            setUploadedImages(prev => [...prev, ...urls]);
            toast.success(`${urls.length} image(s) uploaded successfully`);
        } catch (error) {
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (url: string) => {
        setUploadedImages(prev => prev.filter(img => img !== url));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description) {
            toast.error("Please fill in title and description");
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("/api/tickets/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    attachments: uploadedImages,
                    ahpScores
                }),
            });

            if (response.ok) {
                toast.success("Ticket created successfully");
                onOpenChange(false);
                setFormData({
                    title: "",
                    description: "",
                    priority: "MEDIUM",
                    category: "IT_SUPPORT",
                });
                setUploadedImages([]);
                onSuccess();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to create ticket");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
            toast.error("Failed to create ticket");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0 p-6 pb-4 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/50">
                    <DialogTitle className="flex items-center gap-2 text-xl text-slate-800 dark:text-slate-100">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl mr-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        Buat Tiket Permintaan
                    </DialogTitle>
                    <DialogDescription className="text-sm pt-1">
                        Jelaskan masalah Anda selengkap mungkin agar tim IT dapat mendiagnosis dengan cepat.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 font-semibold">Judul Masalah <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                placeholder="Misal: Printer lantai 2 tidak bisa connect ke laptop"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-11 rounded-xl focus-visible:ring-blue-500 shadow-sm"
                            />
                        </div>

                        {/* Category Field */}
                        {(isSupervisor || settings?.ticket?.requireCategory) && (
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-slate-700 dark:text-slate-300 font-semibold">Kategori Departemen <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl shadow-sm">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept.value} value={dept.value}>
                                                {dept.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(settings?.ticket?.requirePriority && ahpCriteria.length === 0) && (
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-slate-700 dark:text-slate-300 font-semibold">Prioritas (Manual) <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl shadow-sm">
                                        <SelectValue placeholder="Pilih Prioritas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300 font-semibold">Deskripsi Detail <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="description"
                                className="flex min-h-[140px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm resize-none"
                                placeholder="Ceritakan kronologi, pesan error yang muncul, atau langkah yang sudah Anda coba..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Image Upload Area */}
                        <div className="space-y-3 md:col-span-2">
                            <div className="flex justify-between items-center text-sm">
                                <Label className="text-slate-700 dark:text-slate-300 font-semibold">Lampiran Bukti (Opsional)</Label>
                                <span className="text-xs text-muted-foreground">Maks {settings?.ticket?.maxAttachmentSize || 5}MB</span>
                            </div>
                            
                            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-blue-400 transition-all duration-200 text-center flex flex-col items-center justify-center group overflow-hidden">
                                <input
                                    type="file"
                                    accept={settings?.ticket?.allowedFileTypes?.split(',').map((t: string) => `.${t.trim()}`).join(',') || "image/*"}
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    title="Klik untuk memilih file"
                                />
                                
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 mb-3 group-hover:scale-110 transition-transform">
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    ) : (
                                        <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {uploading ? "Sedang Mengunggah..." : "Klik atau Seret file ke sini"}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    Format yang didukung: {settings?.ticket?.allowedFileTypes?.toUpperCase() || "JPG, PNG, PDF"}
                                </span>
                            </div>

                            {/* Image Previews */}
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                    {uploadedImages.map((url, index) => (
                                        <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-900">
                                                <img
                                                    src={url}
                                                    alt={`Lampiran ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                                                className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 backdrop-blur-sm z-20"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AHP Scoring Section */}
                        {ahpCriteria.length > 0 && (
                            <div className="md:col-span-2 space-y-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                                            Penilaian Dampak & Urgensi
                                            <span className="text-[10px] bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-bold uppercase tracking-wider">AI Priority</span>
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Sistem akan secara otomatis menentukan tingkat prioritas berdasarkan kuesioner ini.</p>
                                    </div>
                                </div>
                                
                                {/* Live Result Preview */}
                                {(() => {
                                    let totalScore = 0;
                                    let maxScore = 0;
                                    let validWeight = 0;
                                    
                                    ahpCriteria.forEach(c => {
                                        const score = ahpScores[c.name] || 1;
                                        totalScore += c.weight * score;
                                        validWeight += c.weight;
                                        if (score > maxScore) maxScore = score;
                                    });

                                    if (validWeight > 0 && Math.abs(validWeight - 1) > 0.1) {
                                        totalScore = totalScore / validWeight;
                                    }

                                    let expectedPriority = 'LOW';
                                    if (totalScore >= 3.8) expectedPriority = 'CRITICAL';
                                    else if (totalScore >= 2.8) expectedPriority = 'HIGH';
                                    else if (totalScore >= 1.5) expectedPriority = 'MEDIUM';
                                    
                                    if (maxScore >= 5 && (expectedPriority === 'LOW' || expectedPriority === 'MEDIUM')) expectedPriority = 'HIGH';
                                    else if (maxScore >= 4 && expectedPriority === 'LOW') expectedPriority = 'MEDIUM';

                                    const priorityColors: Record<string, string> = {
                                        'LOW': 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                                        'MEDIUM': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                                        'HIGH': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                                        'CRITICAL': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                                    };

                                    return (
                                        <div className={`mt-2 p-4 rounded-xl border-l-[6px] border flex items-center justify-between transition-all duration-300 shadow-sm ${priorityColors[expectedPriority]}`}>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Prediksi Prioritas</span>
                                                <span className="text-sm font-black tracking-wide">{expectedPriority}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Skor Kalkulasi</span>
                                                <span className="text-lg font-black">{totalScore.toFixed(2)} / 5.00</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {ahpCriteria.map((c) => (
                                        <div key={c.name} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors hover:border-blue-300 pointer-events-auto">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <div>
                                                    <Label className="text-slate-700 dark:text-slate-200 cursor-pointer">{c.name}</Label>
                                                    {c.description && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">{c.description}</p>
                                                    )}
                                                </div>
                                                <span className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 text-xs shrink-0 ml-2">Nilai: {ahpScores[c.name] || 1}</span>
                                            </div>
                                            <div className="relative pt-1 pb-2">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    step="1"
                                                    value={ahpScores[c.name] || 1}
                                                    onChange={(e) => setAhpScores({ ...ahpScores, [c.name]: parseInt(e.target.value) })}
                                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-1">
                                                <span>Sangat Rendah</span>
                                                <span>Sangat Tinggi</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <DialogFooter className="shrink-0 p-4 px-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 sm:justify-between items-center">
                    <p className="text-xs text-muted-foreground hidden sm:block">Harap pastikan semua detail sudah benar.</p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Batalkan
                        </Button>
                        <Button className="flex-1 sm:flex-none h-11 rounded-xl px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 transition-all" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                            Kirim Tiket
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
