import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Edit } from "lucide-react";
import { formatServerDate } from "@/lib/date-format";

export default async function ArticleDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const { id } = params;
    const article = await prisma.knowledgeBase.findUnique({
        where: { id },
        include: { author: { select: { name: true, id: true } } }
    });

    if (!article) return <div>Article not found</div>;

    const canEdit = session.user.id === article.authorId ||
        ['IT_SUPPORT', 'SUPER_ADMIN', 'MANAGER'].includes(session.user.role);

    return (
        <div className="p-6 max-w-4xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <Link href="/dashboard/knowledge-base" className="flex items-center text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Knowledge Base
                </Link>
                {canEdit && (
                    <Link href={`/dashboard/knowledge-base/${id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Article
                        </Button>
                    </Link>
                )}
            </div>

            <Card>
                <CardHeader className="space-y-4">
                    <Badge className="w-fit" variant="secondary">{article.category}</Badge>
                    <CardTitle className="text-3xl font-bold text-foreground">{article.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatServerDate(article.createdAt)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 border-t border-border">
                    <div
                        className="prose dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:text-foreground
                        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg
                        prose-p:text-muted-foreground prose-p:leading-relaxed
                        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                        prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                        prose-li:text-muted-foreground
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-foreground
                        prose-pre:bg-slate-950 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg
                        prose-hr:border-border prose-hr:my-8
                        prose-img:rounded-md prose-img:shadow-sm prose-img:border prose-img:border-border"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
