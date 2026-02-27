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
    { value: "SECURITY", label: "Security" },
    { value: "FINANCE", label: "Finance" },
    { value: "GENERAL", label: "General" },
    { value: "EDC", label: "EDC (Finance)" },
    { value: "CCTV", label: "CCTV (Security)" }
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

    const [ahpCriteria, setAhpCriteria] = useState<{ id: string, name: string, weight: number }[]>([]);
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Buat Tiket Baru</DialogTitle>
                    <DialogDescription>
                        Laporkan masalah baru atau permintaan
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul</Label>
                        <Input
                            id="title"
                            placeholder="Mis: Printer tidak bisa connect"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Category Field */}
                    {(isSupervisor || settings?.ticket?.requireCategory) && (
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
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

                    {(settings?.ticket?.requirePriority) && (
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioritas</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
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

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Jelaskan masalahnya secara detail..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="images">Lampiran (Maks {settings?.ticket?.maxAttachmentSize || 5}MB)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="images"
                                type="file"
                                accept={settings?.ticket?.allowedFileTypes?.split(',').map((t: string) => `.${t.trim()}`).join(',') || "image/*"}
                                multiple
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="cursor-pointer"
                            />
                            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />}
                        </div>

                        {/* Image Previews */}
                        {uploadedImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {uploadedImages.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border-2 border-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(url)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AHP Scoring Section */}
                    {ahpCriteria.length > 0 && (
                        <div className="space-y-4 border-t border-border pt-4 mt-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-foreground">Penilaian Dampak & Urgensi</h4>
                                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">Auto-Priority</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Mohon nilai faktor berikut (Skala 1-5):</p>
                            <div className="grid grid-cols-1 gap-4">
                                {ahpCriteria.map((c) => (
                                    <div key={c.name} className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <Label className="text-foreground">{c.name}</Label>
                                            <span className="text-blue-600 dark:text-blue-400 font-bold">{ahpScores[c.name] || 1} / 5</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={ahpScores[c.name] || 1}
                                            onChange={(e) => setAhpScores({ ...ahpScores, [c.name]: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Sangat Rendah</span>
                                            <span>Sangat Tinggi</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Kirim Tiket
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
