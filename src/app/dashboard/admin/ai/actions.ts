'use server';

import { firestore } from '@/lib/firebase-admin';
import { VirtualSecretaryEvents } from '@/services/ai/event-handler';
import { ContentAlignmentService } from '@/services/ai/content-alignment-service';
import { MissionService } from '@/services/ai/mission-service';
import { revalidatePath } from 'next/cache';

/** Executa fn em chunks para não ultrapassar o rate-limit do Chatwoot */
async function chunkBatch<T>(items: T[], fn: (item: T) => Promise<any>, chunkSize = 10) {
    const results: any[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(fn));
        results.push(...chunkResults);
        if (i + chunkSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    return results;
}

/**
 * Dispara uma pesquisa para todos os usuários que correspondem aos filtros
 */
export async function triggerPollBatchAction(pollId: string, filters: { bairro?: string; role?: string }) {
    try {
        let query: FirebaseFirestore.Query = firestore.collection('users');

        if (filters.bairro && filters.bairro !== 'all') {
            query = query.where('bairro', '==', filters.bairro);
        }
        if (filters.role && filters.role !== 'all') {
            query = query.where('role', '==', filters.role);
        }

        const snapshot = await query.get();
        await chunkBatch(snapshot.docs, (doc) =>
            VirtualSecretaryEvents.triggerPollForUser(doc.id, pollId)
        );

        revalidatePath('/dashboard/admin/ai');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Envia mensagens de alinhamento político semanal para um grupo de usuários
 */
export async function sendAlignmentBatchAction(topic: string, filters: { bairro?: string; role?: string }) {
    try {
        const cleanFilters = {
            bairro: filters.bairro && filters.bairro !== 'all' ? filters.bairro : undefined,
            role: filters.role && filters.role !== 'all' ? filters.role : undefined,
        };

        await ContentAlignmentService.batchSendAlignment(cleanFilters, topic);
        revalidatePath('/dashboard/admin/ai');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Dispara uma missão para todos os usuários que correspondem aos filtros
 */
export async function triggerMissionBatchAction(missionId: string, filters: { bairro?: string; role?: string }) {
    try {
        let query: FirebaseFirestore.Query = firestore.collection('users');

        if (filters.bairro && filters.bairro !== 'all') {
            query = query.where('bairro', '==', filters.bairro);
        }
        if (filters.role && filters.role !== 'all') {
            query = query.where('role', '==', filters.role);
        }

        const snapshot = await query.get();
        await chunkBatch(snapshot.docs, (doc) =>
            MissionService.triggerMissionForUser(doc.id, missionId)
        );

        revalidatePath('/dashboard/admin/ai');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        return { error: error.message };
    }
}
