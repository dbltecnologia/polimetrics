'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function toggleLeaderStatus(leaderId: string, newStatus: 'ativo' | 'inativo') {
    if (!leaderId || !newStatus) {
        return { success: false, message: 'ID do líder e novo status são obrigatórios.' };
    }

    try {
        await firestore.collection('users').doc(leaderId).update({
            status: newStatus,
        });

        revalidatePath('/dashboard/admin/leaders');
        return { success: true, message: `Líder ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Falha ao alterar status do líder.' };
    }
}
