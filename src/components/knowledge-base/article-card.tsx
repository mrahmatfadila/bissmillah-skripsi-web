"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/components/settings-provider";

interface ArticleCardProps {
    article: {
        id: string;
        title: string;
        content: string;
        category: string;
        createdAt: Date;
        author: {
            name: string | null;
            image: string | null;
        };
    };
}

export function ArticleCard({ article }: ArticleCardProps) {
    const categoryColors: Record<string, string> = {
        'IT_SUPPORT': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'SECURITY': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        'FINANCE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        'GENERAL': 'bg-muted text-muted-foreground'
    };

    const { formatDate } = useSystemSettings();

    return (
        <Link href={`/dashboard/knowledge-base/${article.id}`} className="block h-full group">
            <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden bg-card">
                <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary" className={cn("font-semibold rounded-md px-2.5 py-1", categoryColors[article.category] || categoryColors.GENERAL)}>
                            {article.category.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.createdAt)}
                        </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                        {article.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
                    </p>
                </CardContent>

                <CardFooter className="pt-0 border-t border-border p-6 mt-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={article.author.image || undefined} alt={article.author.name || ''} />
                            <AvatarFallback className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                {article.author.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{article.author.name}</span>
                    </div>
                    <span className="text-blue-500 text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        Baca Artikel <ArrowRight className="w-3 h-3" />
                    </span>
                </CardFooter>
            </Card>
        </Link>
    );
}
