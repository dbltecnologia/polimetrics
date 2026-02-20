'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

export async function addElectionRecord(formData: FormData) {
    const year = formData.get('year') as string;
    const totalVotesStr = formData.get('totalVotes') as string;
    const notes = formData.get('notes') as string || '';

    if (!year || !year.trim()) {
        return { success: false, message: 'O ano da eleição é obrigatório.' };
    }

    const totalVotes = parseInt(totalVotesStr, 10);
    if (isNaN(totalVotes) || totalVotes < 0) {
        return { success: false, message: 'O total de votos deve ser um número válido.' };
    }

    try {
        // Check if election already exists for this year
        const existing = await firestore.collection('elections').where('year', '==', year.trim()).get();
        if (!existing.empty) {
            return { success: false, message: 'Já existe um registro para este ano eleitoral.' };
        }

        const payload = {
            year: year.trim(),
            totalVotes,
            notes: notes.trim(),
            createdAt: FieldValue.serverTimestamp(),
        };

        await firestore.collection('elections').add(payload);
        revalidatePath('/dashboard/admin/eleicoes');

        return { success: true, message: 'Registro eleitoral adicionado com sucesso!' };
    } catch (error: any) {
        console.error('Erro ao adicionar eleição:', error);
        return { success: false, message: 'Erro ao processar dados no servidor.' };
    }
}

export async function deleteElectionRecord(id: string) {
    try {
        await firestore.collection('elections').doc(id).delete();
        revalidatePath('/dashboard/admin/eleicoes');
        return { success: true, message: 'Registro excluído.' };
    } catch (error) {
        return { success: false, message: 'Erro ao excluir.' };
    }
}
