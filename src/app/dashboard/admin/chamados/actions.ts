'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function deleteChamadoAction(id: string) {
    try {
        await firestore.collection('chamados').doc(id).delete();
        revalidatePath('/dashboard/admin/chamados');
        return { success: true };
    } catch (error: any) {
        return { error: 'Falha ao remover chamado: ' + error.message };
    }
}
