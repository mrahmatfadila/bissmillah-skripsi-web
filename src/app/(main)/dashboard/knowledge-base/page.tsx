import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, SearchX } from "lucide-react";
import Link from "next/link";
import { KBSearch } from "@/components/knowledge-base/kb-search";
import { ArticleCard } from "@/components/knowledge-base/article-card";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KnowledgeBasePage({ searchParams }: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const resolvedSearchParams = await searchParams;
    const query = typeof resolvedSearchParams.query === 'string' ? resolvedSearchParams.query : '';
    const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : 'ALL';

    const whereClause: any = {};

    // Role-based filtering
    const role = session.user.role;
    if (role === 'STAFF' || role === 'SUPERVISOR') {
        // STAFF and SUPERVISOR can only see GENERAL articles
        whereClause.category = 'GENERAL';
    } else if (role === 'FINANCE') {
        whereClause.category = 'FINANCE';
    } else if (role === 'SECURITY') {
        whereClause.category = 'SECURITY';
    }
    // IT_SUPPORT, SUPER_ADMIN, MANAGER see all articles

    if (category !== 'ALL') {
        // If user already has role restriction, this might conflict
        // For FINANCE user selecting IT_SUPPORT category, they'll get 0 results (correct)
        // For STAFF/SUPERVISOR, they can only see GENERAL regardless of filter
        if (role === 'STAFF' || role === 'SUPERVISOR') {
            whereClause.category = 'GENERAL'; // Force GENERAL for these roles
        } else {
            whereClause.category = category;
        }
    }

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
        ];
    }

    const articles = await prisma.knowledgeBase.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, image: true } } }
    });

    const isAuthorized = ['IT_SUPPORT', 'SUPER_ADMIN', 'MANAGER', 'FINANCE', 'SECURITY'].includes(session.user.role);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <div className="bg-card border-b border-border text-center">
                <div className="max-w-6xl mx-auto p-6 md:p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <BookOpen className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Pusat Pengetahuan
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        Temukan jawaban, panduan teknis, dan prosedur standar operasional untuk membantu pekerjaan Anda.
                    </p>

                    {/* Search Component */}
                    <KBSearch />
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-8 mt-8">
                {/* Action Bar */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">
                        {query ? `Hasil pencarian "${query}"` : "Artikel Terbaru"}
                    </h2>
                    {isAuthorized && (
                        <Link href="/dashboard/knowledge-base/create">
                            <Button className="font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                <Plus className="w-4 h-4 mr-2" />
                                Buat Artikel Baru
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Grid */}
                {articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border text-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <SearchX className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">Tidak ada artikel ditemukan</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm text-center">
                            Kami tidak dapat menemukan artikel yang cocok dengan pencarian atau filter Anda.
                        </p>
                        {isAuthorized && (
                            <Link href="/dashboard/knowledge-base/create">
                                <Button variant="outline">Buat artikel pertama</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
