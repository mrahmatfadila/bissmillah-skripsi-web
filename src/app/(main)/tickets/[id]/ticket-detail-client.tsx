"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    CheckCircle2,
    MessageSquare,
    Paperclip,
    Send,
    UserCircle,
    Calendar,
    Clock,
    AlertCircle,
    FileText,
    BookPlus,
    X,
    Loader2,
    Smile
} from "lucide-react";
import { ConvertToKBDialog } from "@/components/tickets/convert-to-kb-dialog";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/components/settings-provider";

const FormattedDate = ({ date }: { date: string | Date }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <span className="text-xs text-muted-foreground">Loading...</span>;
    return <>{new Date(date).toLocaleString()}</>;
};

const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url);

interface TicketDetailProps {
    ticket: any;
    currentUser: any;
}

export default function TicketDetailClient({ ticket, currentUser }: TicketDetailProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

    const [status, setStatus] = useState(ticket.status);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [comments, setComments] = useState(ticket.comments || []);
    const { formatDate, settings } = useSystemSettings();
    const [isKBDialogOpen, setIsKBDialogOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [uploadingComment, setUploadingComment] = useState(false);
    const [commentAttachments, setCommentAttachments] = useState<string[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && (tab === 'details' || tab === 'chat')) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Only the assignee (who receives the task) can create KB tutorial
    const canCreateKB = currentUser?.id === ticket.assigneeId;

    // Only IT Support, Super Admin, and the assignee can see/edit status
    const canManageStatus = currentUser?.role === 'IT_SUPPORT' ||
        currentUser?.role === 'SUPER_ADMIN' ||
        currentUser?.role === 'MANAGER' ||
        currentUser?.role === 'MANAGER_IT' ||
        currentUser?.id === ticket.assigneeId;

    const [technicians, setTechnicians] = useState<{ id: string, name: string }[]>([]);
    const [assigneeId, setAssigneeId] = useState(ticket.assigneeId || "unassigned");
    const [assigning, setAssigning] = useState(false);

    // Sync state with props after router.refresh()
    useEffect(() => {
        setStatus(ticket.status);
        setAssigneeId(ticket.assigneeId || "unassigned");
        setComments(ticket.comments || []);
    }, [ticket]);

    useEffect(() => {
        if (canManageStatus) {
            fetch('/api/users/technicians')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setTechnicians(data);
                })
                .catch(err => console.error("Failed to load technicians", err));
        }
    }, [canManageStatus]);

    const handleAssign = async (newAssigneeId: string) => {
        setAssigning(true);
        try {
            const payload = { assigneeId: newAssigneeId === "unassigned" ? null : newAssigneeId };
            const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setAssigneeId(newAssigneeId);
                toast.success("Assignee updated successfully");
                router.refresh();
            } else {
                toast.error("Failed to update assignee");
            }
        } catch (error) {
            toast.error("Error updating assignee");
        } finally {
            setAssigning(false);
        }
    };

    // ... handlers ...
    const handleStatusChange = async (newStatus: string) => {
        setUpdatingStatus(true);
        try {
            const res = await fetch(`/api/tickets/${ticket.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setStatus(newStatus);
                toast.success(`Status updated to ${newStatus}`);
                router.refresh();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Error updating status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Mark notifications as read when viewing the ticket
    useEffect(() => {
        const markRead = async () => {
            try {
                // Call API to mark specific notifications related to this ticket as read
                // We'll optimistically assume it works to clear the immediate UI badging if we had local state,
                // but since badging is on Sidebar/AllTickets page, this simply updates DB.
                await fetch('/api/notifications/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticketId: ticket.id })
                });
                // Trigger a refresh of navigation state (sidebar badges)
                window.dispatchEvent(new Event('ticket-stats-refresh'));
                router.refresh();
            } catch (e) {
                console.error("Failed to mark notifications read", e);
            }
        };
        markRead();
    }, [ticket.id, router]);

    // Focus on reply area if #comments hash is present or tab is chat
    useEffect(() => {
        if (window.location.hash === '#comments' || searchParams.get('tab') === 'chat') {
            setActiveTab('chat');
            setTimeout(() => {
                const textarea = document.getElementById('reply-textarea');
                if (textarea) {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    textarea.focus();
                }
            }, 500); // Small delay to allow render
        }
    }, []);

    const handleCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validation for size and type based on settings
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

        setUploadingComment(true);
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
            setCommentAttachments(prev => [...prev, ...urls]);
            toast.success(`${urls.length} image(s) uploaded`);
        } catch (error) {
            toast.error('Failed to upload images');
        } finally {
            setUploadingComment(false);
        }
    };

    const removeCommentImage = (url: string) => {
        setCommentAttachments(prev => prev.filter(img => img !== url));
    };

    const onEmojiClick = (emojiObject: any) => {
        setComment(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleCommentSubmit = async () => {
        if (!comment.trim() && commentAttachments.length === 0) {
            toast.error("Please write a message or attach an image");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: comment || "(Gambar)",
                    attachments: commentAttachments
                }),
            });

            if (res.ok) {
                const newComment = await res.json();
                setComments([...comments, newComment]);
                setComment("");
                setCommentAttachments([]);
                toast.success("Reply sent");
                router.refresh();
            } else {
                toast.error("Failed to send reply");
            }
        } catch (error) {
            toast.error("Error sending reply");
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "CRITICAL": return "bg-red-200 text-red-800 border-red-200";
            case "HIGH": return "bg-red-100 text-red-700 border-red-200";
            case "MEDIUM": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-green-100 text-green-700 border-green-200";
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "OPEN": return "bg-blue-100 text-blue-700 border-blue-200";
            case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "RESOLVED": return "bg-green-100 text-green-700 border-green-200";
            case "CLOSED": return "bg-gray-100 text-gray-700 border-gray-200";
            case "PENDING": return "bg-purple-100 text-purple-700 border-purple-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getSlaStatus = () => {
        if (!settings?.sla?.enabled) return null;

        let allocatedHours = 24;
        if (ticket.priority === 'CRITICAL') allocatedHours = settings.sla.criticalHours || 2;
        if (ticket.priority === 'HIGH') allocatedHours = settings.sla.highHours || 8;
        if (ticket.priority === 'MEDIUM') allocatedHours = settings.sla.mediumHours || 24;
        if (ticket.priority === 'LOW') allocatedHours = settings.sla.lowHours || 72;

        const createdAt = new Date(ticket.createdAt).getTime();
        const targetTime = createdAt + (allocatedHours * 60 * 60 * 1000);
        const now = new Date().getTime();

        if (status === 'RESOLVED' || status === 'CLOSED' || status === 'CANCELLED') {
            const updatedAt = new Date(ticket.updatedAt).getTime();
            if (updatedAt > targetTime && status !== 'CANCELLED') {
                return { text: "SLA Terlewati", color: "bg-red-100 text-red-700 border-red-200" };
            } else if (status !== 'CANCELLED') {
                return { text: "SLA Terpenuhi", color: "bg-green-100 text-green-700 border-green-200" };
            }
            return null; // Don't show for cancelled
        }

        const remainingMs = targetTime - now;
        if (remainingMs < 0) {
            return { text: `SLA Telat`, color: "bg-red-100 text-red-800 border-red-300 animate-pulse" };
        }

        const elapsedMs = now - createdAt;
        const totalMs = allocatedHours * 60 * 60 * 1000;
        const warningThresholdPercent = settings.sla.warningThreshold || 75;

        if ((elapsedMs / totalMs) * 100 >= warningThresholdPercent) {
            return { text: "SLA Warning", color: "bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse" };
        }

        return { text: "SLA Aman", color: "bg-green-100 text-green-700 border-green-200" };
    };

    const slaStatus = getSlaStatus();

    return (
        <div className="min-h-screen bg-background p-6 pb-20">
            {/* ... Existing JSX ... */}
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header / Nav */}
                <div className="flex items-center gap-4">
                    <Link href="/tickets/mine">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex flex-wrap items-center gap-2 md:gap-3">
                            Tiket {ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}
                            <Badge variant="outline" className={cn("border whitespace-nowrap", getPriorityColor(ticket.priority))}>
                                {ticket.priority}
                            </Badge>
                            <Badge variant="outline" className={cn("border whitespace-nowrap", getStatusColor(status))}>
                                {status.replace(/_/g, " ")}
                            </Badge>
                            {slaStatus && (
                                <Badge variant="outline" className={cn("border whitespace-nowrap", slaStatus.color)} title="Service Level Agreement">
                                    <Clock className="w-3 h-3 mr-1 inline-block" />
                                    {slaStatus.text}
                                </Badge>
                            )}
                            {ticket.kbArticleId && (
                                <Link href={`/dashboard/knowledge-base/${ticket.kbArticleId}`}>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 cursor-pointer whitespace-nowrap">
                                        <BookPlus className="w-3 h-3 mr-1 inline-block" />
                                        KB Published
                                    </Badge>
                                </Link>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm">Dibuat pada {formatDate(ticket.createdAt)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs Header */}
                        <div className="flex items-center gap-6 border-b border-gray-200 mb-2">
                            <button
                                onClick={() => { setActiveTab('details'); router.replace(`?tab=details`, { scroll: false }); }}
                                className={cn(
                                    "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'details' ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                <FileText className="w-4 h-4" /> Detail Tiket
                            </button>
                            <button
                                onClick={() => { setActiveTab('chat'); router.replace(`?tab=chat`, { scroll: false }); }}
                                className={cn(
                                    "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'chat' ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" /> Diskusi & Chat
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    activeTab === 'chat' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" : "bg-muted text-muted-foreground"
                                )}>{comments.length}</span>
                            </button>
                        </div>

                        {/* Ticket Description Tab */}
                        <div className={activeTab === 'details' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={ticket.creator.image || `https://ui-avatars.com/api/?name=${ticket.creator.name}&background=16a34a&color=fff`} />
                                                <AvatarFallback>{ticket.creator.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground">{ticket.creator.name}</p>
                                                <p className="text-xs text-muted-foreground">{ticket.creator.role?.replace('_', ' ')} • {ticket.creator.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <h2 className="text-lg font-semibold mb-2">{ticket.title}</h2>
                                    <div className="mb-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Permasalahan:</span>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg text-foreground whitespace-pre-wrap border-l-4 border-blue-500">
                                        {ticket.description}
                                    </div>

                                    {/* Attached Images */}
                                    {ticket.attachments && ticket.attachments.length > 0 && (
                                        <div className="mt-4">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">📎 Lampiran:</span>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {ticket.attachments.map((url: string, index: number) => {
                                                    const isImg = isImageUrl(url);
                                                    return (
                                                        <div
                                                            key={index}
                                                            onClick={() => isImg ? setLightboxImage(url) : window.open(url, '_blank')}
                                                            className="group relative block cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all"
                                                        >
                                                            {isImg ? (
                                                                <img
                                                                    src={url}
                                                                    alt={`Attachment ${index + 1}`}
                                                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                    <FileText className="w-8 h-8 mb-2" />
                                                                    <span className="text-xs font-medium truncate px-2 w-full text-center">
                                                                        {url.split('/').pop() || 'Dokumen'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                                <span className="text-white text-xs font-semibold flex items-center gap-1">
                                                                    {isImg ? (
                                                                        <>
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                            </svg>
                                                                            Klik untuk memperbesar
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                            </svg>
                                                                            Unduh / Buka
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Comments - Chat Style Tab */}
                        <div className={activeTab === 'chat' ? 'block animate-in fade-in duration-300' : 'hidden'}>
                            <div className="space-y-4">
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scroll-smooth">
                                    {comments.map((cmt: any) => {
                                        const isCurrentUser = cmt.author.id === currentUser?.id;
                                        return (
                                            <div
                                                key={cmt.id}
                                                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    <Avatar className={`h-10 w-10 ${isCurrentUser ? 'ring-2 ring-blue-400' : 'ring-2 ring-border'}`}>
                                                        <AvatarImage src={cmt.author.image || `https://ui-avatars.com/api/?name=${cmt.author.name}&background=${isCurrentUser ? '2563eb' : 'e5e7eb'}&color=${isCurrentUser ? 'fff' : '374151'}`} />
                                                        <AvatarFallback className={`text-sm font-bold ${isCurrentUser
                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-200'
                                                            }`}>
                                                            {cmt.author.name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                {/* Chat Bubble */}
                                                <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                    {/* Author Name & Time */}
                                                    <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <span className="text-xs font-semibold text-foreground">{cmt.author.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDate(cmt.createdAt)}
                                                        </span>
                                                    </div>

                                                    {/* Message Bubble */}
                                                    <div className={`
                                                        relative px-4 py-3 rounded-2xl shadow-sm
                                                        ${isCurrentUser
                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm'
                                                            : 'bg-card border border-border text-foreground rounded-tl-sm'
                                                        }
                                                    `}>
                                                        {cmt.content && (
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                                {cmt.content}
                                                            </p>
                                                        )}

                                                        {/* Attached Images in Chat */}
                                                        {cmt.attachments && cmt.attachments.length > 0 && (
                                                            <div className={`grid gap-2 ${cmt.content ? 'mt-2' : ''} ${cmt.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                                {cmt.attachments.map((url: string, idx: number) => {
                                                                    const isImg = isImageUrl(url);
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            onClick={() => isImg ? setLightboxImage(url) : window.open(url, '_blank')}
                                                                            className={`cursor-pointer group relative overflow-hidden rounded-lg bg-white/10 border ${isCurrentUser ? 'border-white/20' : 'border-border'}`}
                                                                        >
                                                                            {isImg ? (
                                                                                <img
                                                                                    src={url}
                                                                                    alt={`Attachment ${idx + 1}`}
                                                                                    className="w-full max-w-xs h-auto object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full max-w-xs h-24 flex flex-col items-center justify-center p-2 text-center group-hover:opacity-90 transition-opacity">
                                                                                    <FileText className={`w-6 h-6 mb-1 ${isCurrentUser ? 'text-white' : 'text-gray-500'}`} />
                                                                                    <span className={`text-[10px] font-medium truncate w-full ${isCurrentUser ? 'text-white' : 'text-gray-600'}`}>
                                                                                        {url.split('/').pop() || 'File'}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    {isImg ? (
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                                    ) : (
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                    )}
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Bubble Tail */}
                                                        <div className={`
                                                            absolute top-0 w-3 h-3
                                                            ${isCurrentUser
                                                                ? 'right-0 -mr-1 bg-blue-600 rounded-br-full'
                                                                : 'left-0 -ml-1 bg-card border-l border-t border-border rounded-bl-full'
                                                            }
                                                        `} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Reply Input - Chat Style */}
                                <Card className="sticky bottom-0 shadow-lg border-2 border-blue-100">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            {/* Current User Avatar */}
                                            <Avatar className="h-10 w-10 ring-2 ring-blue-400 flex-shrink-0">
                                                <AvatarImage src={currentUser?.image || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=2563eb&color=fff`} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold">
                                                    {currentUser?.name?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Input Area */}
                                            <div className="flex-1 space-y-3">
                                                <Textarea
                                                    id="reply-textarea" // Added ID for anchor linking
                                                    placeholder="💬 Tulis balasan Anda..."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="min-h-[80px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && e.ctrlKey && !submitting && (comment.trim() || commentAttachments.length > 0)) {
                                                            handleCommentSubmit();
                                                        }
                                                    }}
                                                />

                                                {/* Image Previews */}
                                                {commentAttachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {commentAttachments.map((url, index) => {
                                                            const isImg = isImageUrl(url);
                                                            return (
                                                                <div key={index} className="relative group">
                                                                    {isImg ? (
                                                                        <img
                                                                            src={url}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-500">
                                                                            <FileText className="w-6 h-6 mb-1" />
                                                                            <span className="text-[8px] px-1 truncate w-full text-center">
                                                                                {url.split('/').pop()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeCommentImage(url)}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-2 rounded-lg gap-3 sm:gap-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Image Upload Button */}
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept={settings?.ticket?.allowedFileTypes?.split(',').map((t: string) => `.${t.trim()}`).join(',') || "image/*"}
                                                                multiple
                                                                onChange={handleCommentImageUpload}
                                                                disabled={uploadingComment}
                                                                className="hidden"
                                                            />
                                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
                                                                {uploadingComment ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                )}
                                                                <span className="text-xs font-medium">Doc/File</span>
                                                            </div>
                                                        </label>

                                                        {/* Emoji Picker Button */}
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                                                            >
                                                                <Smile className="w-4 h-4" />
                                                                <span className="text-xs font-medium">Emoji</span>
                                                            </button>

                                                            {/* Emoji Picker Popup */}
                                                            {showEmojiPicker && (
                                                                <div className="absolute bottom-full left-0 mb-2 z-50">
                                                                    <EmojiPicker
                                                                        onEmojiClick={onEmojiClick}
                                                                        width={300}
                                                                        height={380}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {canCreateKB && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                                                                onClick={() => setIsKBDialogOpen(true)}
                                                                disabled={!!ticket.kbArticleId}
                                                            >
                                                                <BookPlus className="w-4 h-4 mr-1 md:mr-2" />
                                                                <span className="hidden md:inline">{ticket.kbArticleId ? "Tutorial Published" : "Buat Tutorial"}</span>
                                                                <span className="inline md:hidden">KB</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                                                        <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Ctrl + Enter untuk kirim</span>
                                                        <Button
                                                            onClick={handleCommentSubmit}
                                                            disabled={submitting || (!comment.trim() && commentAttachments.length === 0)}
                                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-full sm:w-auto"
                                                        >
                                                            {submitting ? (
                                                                <>
                                                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                                                    Kirim...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                    Kirim
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Status Panel - Only for IT Support, Super Admin, and Assignee */}
                    {canManageStatus && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase text-muted-foreground font-bold">Status Tiket</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1 block">Status Saat Ini</label>
                                        <Select
                                            value={status}
                                            onValueChange={handleStatusChange}
                                            disabled={updatingStatus}
                                        >
                                            <SelectTrigger className={cn(
                                                "border-l-4 h-10 w-full",
                                                status === 'OPEN' ? 'border-l-blue-500 bg-blue-50/50' :
                                                    status === 'IN_PROGRESS' ? 'border-l-orange-500 bg-orange-50/50' :
                                                        status === 'PENDING' ? 'border-l-purple-500 bg-purple-50/50' :
                                                            status === 'CANCELLED' ? 'border-l-red-500 bg-red-50/50' :
                                                                status === 'RESOLVED' ? 'border-l-green-500 bg-green-50/50' :
                                                                    'border-l-gray-500 bg-gray-50/50'
                                            )}>
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OPEN">Terbuka (Open)</SelectItem>
                                                <SelectItem value="IN_PROGRESS">Diproses (In Progress)</SelectItem>
                                                <SelectItem value="PENDING">Tertunda (Pending)</SelectItem>
                                                <SelectItem value="RESOLVED">Selesai (Resolved)</SelectItem>
                                                <SelectItem value="CLOSED">Ditutup (Closed)</SelectItem>
                                                <SelectItem value="CANCELLED">Dibatalkan (Cancelled)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3 pb-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Kategori</span>
                                            <span className="font-medium">{ticket.category || "Unassigned"}</span>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-foreground block">Penerima Tugas</label>
                                            <Select
                                                value={assigneeId}
                                                onValueChange={handleAssign}
                                                disabled={assigning}
                                            >
                                                <SelectTrigger className="border-l-4 border-l-gray-300 h-10 bg-muted/20">
                                                    <SelectValue placeholder="Pilih Teknisi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
                                                    {technicians.map((tech) => (
                                                        <SelectItem key={tech.id} value={tech.id}>
                                                            {tech.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* AHP Score Display */}
                                    {ticket.ahpScore !== null && ticket.ahpScore !== undefined && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2 pt-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground font-medium">Auto-Score (AHP)</span>
                                                    <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
                                                        {Number(ticket.ahpScore).toFixed(2)} / 5.0
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full ${Number(ticket.ahpScore) >= 4 ? 'bg-red-500' :
                                                            Number(ticket.ahpScore) >= 3 ? 'bg-orange-500' :
                                                                'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${(Number(ticket.ahpScore) / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            <ConvertToKBDialog
                open={isKBDialogOpen}
                onOpenChange={setIsKBDialogOpen}
                ticket={ticket}
            />

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        <img
                            src={lightboxImage}
                            alt="Full size preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                        Klik di luar gambar atau tombol ✕ untuk menutup
                    </div>
                </div>
            )}
        </div>
    );
}
