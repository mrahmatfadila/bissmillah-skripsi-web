"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ConvertToKBDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: {
        id: string;
        title: string;
        description: string;
        category?: string;
        comments: any[];
    };
}

export function ConvertToKBDialog({ open, onOpenChange, ticket }: ConvertToKBDialogProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "IT_SUPPORT",
        content: ""
    });

    useEffect(() => {
        if (open && ticket) {
            // Find a resolution comment if possible, otherwise use description
            // For now, let's just prefill with description + a prompt for solution
            let initialContent = `<h3>📋 Deskripsi Masalah</h3>
<p>${ticket.description}</p>
<hr/>
<h3>🛠️ Solusi & Langkah Perbaikan</h3>
<p>Ikuti langkah-langkah berikut untuk menyelesaikan masalah ini:</p>
<h4>Langkah 1: [Judul Langkah]</h4>
<p>Jelaskan langkah pertama dengan detail.</p>
<h4>Langkah 2: [Judul Langkah]</h4>
<p>Jelaskan langkah kedua dengan detail.</p>
<h4>Langkah 3: [Judul Langkah]</h4>
<p>Jelaskan langkah ketiga dengan detail.</p>
<hr/>
<h3>✅ Verifikasi</h3>
<p>Setelah melakukan langkah-langkah di atas, pastikan untuk:</p>
<ul>
    <li>Masalah telah teratasi</li>
    <li>Sistem berfungsi normal</li>
    <li>Tidak ada error yang muncul</li>
</ul>
<blockquote>💡 <strong>Tips:</strong> Jika masalah masih berlanjut, hubungi tim terkait untuk bantuan lebih lanjut.</blockquote>`;


            setFormData({
                title: ticket.title,
                category: ticket.category || "IT_SUPPORT",
                content: initialContent
            });
        }
    }, [open, ticket]);

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Please fill in title and content");
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("/api/kb/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    ticketId: ticket.id // Pass ticket ID to link them
                }),
            });

            if (response.ok) {
                const article = await response.json();

                // Auto-post comment to ticket
                await fetch(`/api/tickets/${ticket.id}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: `**Solusi / Tutorial Tersedia:**\n\nPanduan langkah demi langkah telah dibuat untuk masalah ini. Silahkan baca selengkapnya: \n[📄 ${formData.title}](/dashboard/knowledge-base/${article.id})`
                    }),
                });

                toast.success("Article published and linked to ticket");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error("Failed to publish article");
            }
        } catch (error) {
            console.error("Error creating KB article:", error);
            toast.error("Failed to publish");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Convert to Knowledge Base Article</DialogTitle>
                    <DialogDescription>
                        Create a reusable guide or solution from this ticket.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IT_SUPPORT">IT Support</SelectItem>
                                <SelectItem value="SECURITY">Security</SelectItem>
                                <SelectItem value="FINANCE">Finance</SelectItem>
                                <SelectItem value="GENERAL">General</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Content</Label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(value) => setFormData({ ...formData, content: value })}
                            placeholder="Describe the issue and the solution..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Publish Article
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
