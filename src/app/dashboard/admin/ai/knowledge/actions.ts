'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function createKnowledgeEntryAction(formData: FormData) {
    const title = (formData.get('title') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'geral';
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';

    if (!title || !content) {
        return { success: false, message: 'Título e conteúdo são obrigatórios.' };
    }

    const tags = tagsRaw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    try {
        await firestore.collection('knowledge_base').add({
            title,
            content,
            category,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/dashboard/admin/ai/knowledge');
        return { success: true, message: 'Entrada criada com sucesso!' };
    } catch (err: any) {
        console.error('[knowledge] createEntry:', err);
        return { success: false, message: err.message || 'Erro ao salvar.' };
    }
}

export async function deleteKnowledgeEntryAction(id: string) {
    try {
        await firestore.collection('knowledge_base').doc(id).delete();
        revalidatePath('/dashboard/admin/ai/knowledge');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
