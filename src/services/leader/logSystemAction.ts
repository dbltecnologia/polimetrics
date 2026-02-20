
'use server';

import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Registra uma ação gerada pelo sistema no Firestore.
 * Esta função é para ser chamada por outras funções de servidor, não diretamente por formulários de cliente.
 *
 * @param leaderId O ID do líder que iniciou a ação.
 * @param actionType Uma string que descreve o tipo de ação (ex: 'member_registered').
 * @param details Um objeto contendo detalhes relevantes para a ação.
 */
export async function logSystemAction(
    leaderId: string,
    actionType: string,
    details: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    if (!leaderId || !actionType) {
        const errorMsg = "ID do líder e tipo da ação são obrigatórios para o log do sistema.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        await firestore.collection('system_logs').add({
            actorId: leaderId,       // Quem realizou a ação
            actionType,            // O que foi feito
            details,               // Detalhes adicionais
            timestamp: FieldValue.serverTimestamp(), // Quando foi feito
        });

        return { success: true };

    } catch (error) {
        console.error('Falha ao registrar ação do sistema:', error);
        // Retorna sucesso como false, mas não quebra a operação principal que a chamou
        return { success: false, error: 'Falha ao registrar a ação no log.' };
    }
}
