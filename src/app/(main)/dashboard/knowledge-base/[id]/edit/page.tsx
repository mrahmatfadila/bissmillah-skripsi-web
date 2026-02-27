import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { EditArticleForm } from "@/components/knowledge-base/edit-article-form";

export default async function EditArticlePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const { id } = params;
    const article = await prisma.knowledgeBase.findUnique({
        where: { id },
        include: { author: { select: { name: true, id: true } } }
    });

    if (!article) {
        redirect("/dashboard/knowledge-base");
    }

    // Check permissions
    const canEdit = session.user.id === article.authorId ||
        ['IT_SUPPORT', 'SUPER_ADMIN', 'MANAGER'].includes(session.user.role);

    if (!canEdit) {
        redirect(`/dashboard/knowledge-base/${id}`);
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Artikel</h1>
                <EditArticleForm article={article} />
            </div>
        </div>
    );
}
