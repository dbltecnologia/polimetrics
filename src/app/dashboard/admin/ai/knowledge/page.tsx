import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KnowledgeBaseManager } from './_components/KnowledgeBaseManager';

export const revalidate = 0;

async function getKnowledgeEntries() {
    try {
        const snap = await firestore
            .collection('knowledge_base')
            .orderBy('createdAt', 'desc')
            .get();
        return snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as {
                title: string;
                content: string;
                category: string;
                tags: string[];
                createdAt: string;
            }),
        }));
    } catch {
        return [];
    }
}

export default async function KnowledgePage() {
    const entries = await getKnowledgeEntries();

    return (
        <main>
            <AdminHeader
                title="Base de Conhecimento"
                subtitle="Gerencie os documentos que o Secretário Virtual usa como contexto (RAG)."
            >
                <Link
                    href="/dashboard/admin/ai"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>
            </AdminHeader>
            <div className="p-6 md:p-8">
                <KnowledgeBaseManager initialEntries={entries} />
            </div>
        </main>
    );
}
