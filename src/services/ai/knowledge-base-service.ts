import { firestore } from '@/lib/firebase-admin';

export interface KnowledgeSnippet {
    id: string;
    title: string;
    content: string;
    category: 'proposta' | 'biografia' | 'historico' | 'faq' | 'geral';
    tags: string[];
    status: 'published' | 'draft';
    updatedAt: string;
}

export class KnowledgeBaseService {
    /**
     * Busca fragmentos de conhecimento relevantes para uma pergunta
     * (Simulação simples de RAG por busca de palavras-chave)
     */
    static async getRelevantContext(query: string): Promise<string> {
        try {
            const snapshot = await firestore.collection('knowledge_base')
                .where('status', '==', 'published')
                .get();

            if (snapshot.empty) return "";

            const queryLower = query.toLowerCase();
            const relevantSnippets: string[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data() as KnowledgeSnippet;
                const matches = data.tags?.some(tag => queryLower.includes(tag.toLowerCase())) ||
                               data.title?.toLowerCase().includes(queryLower) ||
                               queryLower.includes(data.category);

                if (matches) {
                    relevantSnippets.push(`[${data.category.toUpperCase()}: ${data.title}]\n${data.content}`);
                }
            });

            // Se não encontrou por tags, pegar os snippets de biografia e FAQ como fallback geral
            if (relevantSnippets.length === 0) {
                const fallback = snapshot.docs
                    .filter(d => ['biografia', 'faq'].includes(d.data().category))
                    .slice(0, 2)
                    .map(d => d.data().content);
                relevantSnippets.push(...fallback);
            }

            return relevantSnippets.join('\n\n---\n\n');
        } catch (error) {
            console.error('[KNOWLEDGE_BASE_ERROR]:', error);
            return "";
        }
    }

    /**
     * Adiciona um novo fragmento de conhecimento
     */
    static async addSnippet(snippet: Omit<KnowledgeSnippet, 'id' | 'updatedAt'>) {
        const docRef = await firestore.collection('knowledge_base').add({
            ...snippet,
            updatedAt: new Date().toISOString()
        });
        return docRef.id;
    }
}
