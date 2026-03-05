"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useSystemSettings } from "@/components/settings-provider";


export function ActiveTicketsList({ tickets: allTickets }: { tickets: any[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const { formatDate } = useSystemSettings();
    const itemsPerPage = 5;

    // Calculate pagination
    const totalPages = Math.ceil(allTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const tickets = allTickets.slice(startIndex, endIndex);

    // Generate page numbers
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
        <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-base font-bold text-foreground">
                        Tiket Terbaru
                    </CardTitle>
                    {allTickets.length > itemsPerPage && (
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, allTickets.length)} dari {allTickets.length} tiket
                        </p>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="flex-1">
                    {tickets.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">Tidak ada tiket aktif ditemukan.</div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                                <div className="p-4 rounded-xl border border-border hover:shadow-md transition-shadow bg-card mb-2 cursor-pointer">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                                        <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate w-full sm:w-3/4">{ticket.title}</p>
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(ticket.createdAt)}
                                            </span>
                                            <Badge variant="secondary" className="border-none whitespace-nowrap">{ticket.status}</Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={ticket.creator.image || `https://ui-avatars.com/api/?name=${ticket.creator.name}&background=random`} />
                                                <AvatarFallback>{ticket.creator.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{ticket.creator.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{ticket.creator.department || 'Staff'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 whitespace-nowrap border-r border-border pr-4">
                                                {ticket.category || 'General'}
                                            </span>
                                            <span className={`font-medium whitespace-nowrap ${ticket.priority === 'CRITICAL' ? 'text-red-600' : ticket.priority === 'HIGH' ? 'text-red-500' : ticket.priority === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            Halaman {currentPage} dari {totalPages}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>

                            {getPageNumbers().map((page, idx) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-xs">...</span>
                                ) : (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`h-7 w-7 p-0 text-xs ${currentPage === page ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
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
                                className="h-7 w-7 p-0"
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
