"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function CreateArticlePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !category || !content) {
            toast.error("Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/kb/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, content }),
            });

            if (res.ok) {
                toast.success("Article created successfully");
                router.push("/dashboard/knowledge-base");
                router.refresh();
            } else {
                toast.error("Failed to create article");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link href="/dashboard/knowledge-base" className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Knowledge Base
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Buat Artikel Baru</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Judul</label>
                            <Input placeholder="Judul artikel" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kategori</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kategori" />
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
                            <label className="text-sm font-medium">Konten Artikel</label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Tulis isi artikel pengetahuan yang lengkap di sini..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Terbitkan Artikel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
