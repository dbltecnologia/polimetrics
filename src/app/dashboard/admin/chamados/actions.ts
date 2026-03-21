'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { VirtualSecretaryEvents } from '@/services/ai/event-handler';

export async function deleteChamadoAction(id: string) {
    try {
        await firestore.collection('chamados').doc(id).delete();
        revalidatePath('/dashboard/admin/chamados');
        return { success: true };
    } catch (error: any) {
        return { error: 'Falha ao remover chamado: ' + error.message };
    }
}

export async function updateChamadoStatusAction(id: string, status: string) {
    try {
        await firestore.collection('chamados').doc(id).update({ status });
        
        // Notificação assíncrona para o Secretário Virtual (WhatsApp)
        // Não usamos await aqui se não quisermos travar o retorno da UI do Admin, 
        // mas como é uma ação de servidor Next.js, é melhor tratar erros internamente no serviço.
        VirtualSecretaryEvents.onDemandStatusChanged(id, status).catch(console.error);

        revalidatePath('/dashboard/admin/chamados');
        return { success: true };
    } catch (error: any) {
        return { error: 'Falha ao atualizar chamado: ' + error.message };
    }
}
