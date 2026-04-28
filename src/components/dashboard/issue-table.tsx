"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Calendar, MoreVertical, Loader2, Eye, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSystemSettings } from "@/components/settings-provider";
import { translateStatus } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IssueTableProps {
    tickets: any[];
    totalCount?: number;
}

export function IssueTable({ tickets: allTickets, totalCount }: IssueTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const itemsPerPage = 5;

    // Filter tickets
    const filteredTickets = allTickets.filter(ticket => {
        const statusMatch = filterStatus === 'ALL' || ticket.status === filterStatus;
        const priorityMatch = filterPriority === 'ALL' || ticket.priority === filterPriority;
        return statusMatch && priorityMatch;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const tickets = filteredTickets.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterPriority]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "bg-blue-100 text-blue-700 hover:bg-blue-200";
            case "IN_PROGRESS": return "bg-orange-100 text-orange-700 hover:bg-orange-200";
            case "RESOLVED": return "bg-green-100 text-green-700 hover:bg-green-200";
            case "CLOSED": return "bg-gray-100 text-gray-700 hover:bg-gray-200";
            case "PENDING": return "bg-purple-100 text-purple-700 hover:bg-purple-200";
            case "CANCELLED": return "bg-red-100 text-red-700 hover:bg-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL": return "bg-red-200 text-red-800";
            case "HIGH": return "bg-red-100 text-red-700";
            case "MEDIUM": return "bg-orange-100 text-orange-700";
            default: return "bg-green-100 text-green-700";
        }
    };

    const { formatDate } = useSystemSettings();

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 md:gap-0">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <CardTitle className="text-base font-bold text-foreground uppercase tracking-wider">Daftar Tiket Terbaru</CardTitle>
                    {totalCount && totalCount > itemsPerPage && (
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} dari {filteredTickets.length} tiket
                            {filteredTickets.length !== allTickets.length && ` (${allTickets.length} total)`}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-8 px-3 text-xs border border-border rounded-md bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="OPEN">Terbuka</option>
                        <option value="IN_PROGRESS">Di Proses</option>
                        <option value="PENDING">Tertunda</option>
                        <option value="RESOLVED">Selesai</option>
                        <option value="CLOSED">Ditutup</option>
                        <option value="CANCELLED">Dibatalkan</option>
                    </select>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="h-8 px-3 text-xs border border-border rounded-md bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ALL">Semua Priority</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <Link href="/tickets/mine">
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-2">
                            Lihat Semua
                            {totalCount && totalCount > allTickets.length && (
                                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                    +{totalCount - allTickets.length}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-border overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <Checkbox className="border-muted-foreground" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Tiket</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ringkasan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ditugaskan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pelapor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioritas</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dibuat</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <Checkbox className="border-muted-foreground" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-blue-600">
                                            {ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px] md:max-w-xs whitespace-normal">
                                        <div>
                                            <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{ticket.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {ticket.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={ticket.assignee.image || `https://ui-avatars.com/api/?name=${ticket.assignee.name}&background=random`} />
                                                    <AvatarFallback className="text-xs">{ticket.assignee.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-foreground">{ticket.assignee.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Belum ditugaskan</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={ticket.creator.image || `https://ui-avatars.com/api/?name=${ticket.creator.name}&background=random`} />
                                                <AvatarFallback className="text-xs">{ticket.creator.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm text-foreground">{ticket.creator.name}</p>
                                                <p className="text-xs text-muted-foreground">{ticket.creator.department}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`${getStatusColor(ticket.status)} text-xs font-medium px-2.5 py-0.5 whitespace-nowrap`}>
                                            {translateStatus(ticket.status)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs font-medium px-2.5 py-0.5 whitespace-nowrap`}>
                                            {ticket.priority}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(ticket.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                <Link href={`/tickets/${ticket.id}`}>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Detail
                                                    </DropdownMenuItem>
                                                </Link>
                                                <Link href={`/tickets/${ticket.id}?tab=chat`}>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        Balas Chat
                                                    </DropdownMenuItem>
                                                </Link>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 gap-4 sm:gap-0">
                        <p className="text-sm text-muted-foreground">
                            Halaman {currentPage} dari {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {getPageNumbers().map((page, idx) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                                ) : (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                                    >
                                        {page}
                                    </Button>
                                )
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

