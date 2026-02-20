'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

export async function createPoll(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const rawOptions = formData.get('options') as string;

    if (!title || !rawOptions) {
        return { success: false, message: 'Título e opções são obrigatórios.' };
    }

    const optionsArray = rawOptions.split('\n').map(o => o.trim()).filter(Boolean);
    if (optionsArray.length < 2) {
        return { success: false, message: 'Forneça pelo menos duas opções válidas.' };
    }

    const options = optionsArray.map((text, i) => ({
        id: `opt_${Date.now()}_${i}`,
        text
    }));

    try {
        const payload = {
            title,
            description: description || '',
            options,
            status: 'active',
            createdAt: FieldValue.serverTimestamp(),
            votedBy: {},
        };

        await firestore.collection('polls').add(payload);
        revalidatePath('/dashboard/admin/votacoes');
        revalidatePath('/dashboard/gabinete');

        return { success: true, message: 'Votação criada com sucesso!' };
    } catch (error: any) {
        console.error('Erro ao criar votação:', error);
        return { success: false, message: 'Erro ao criar votação no servidor.' };
    }
}

export async function closePoll(pollId: string) {
    try {
        await firestore.collection('polls').doc(pollId).update({
            status: 'closed'
        });
        revalidatePath('/dashboard/admin/votacoes');
        revalidatePath('/dashboard/gabinete');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
