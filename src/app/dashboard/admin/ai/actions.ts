'use server';

import { firestore } from '@/lib/firebase-admin';
import { VirtualSecretaryEvents } from '@/services/ai/event-handler';
import { ContentAlignmentService } from '@/services/ai/content-alignment-service';
import { revalidatePath } from 'next/cache';

/**
 * Dispara uma pesquisa para todos os usuários que correspondem aos filtros
 */
export async function triggerPollBatchAction(pollId: string, filters: { bairro?: string; role?: string }) {
    try {
        let query: any = firestore.collection('users');

        if (filters.bairro && filters.bairro !== 'all') {
            query = query.where('bairro', '==', filters.bairro);
        }
        if (filters.role && filters.role !== 'all') {
            query = query.where('role', '==', filters.role);
        }

        const snapshot = await query.get();
        const promises = snapshot.docs.map(doc => 
            VirtualSecretaryEvents.triggerPollForUser(doc.id, pollId)
        );

        await Promise.all(promises);
        revalidatePath('/dashboard/admin/ai');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        return { error: error.message };
    }
}

import { MissionService } from '@/services/ai/mission-service';

/**
 * Dispara uma missão para todos os usuários que correspondem aos filtros
 */
export async function triggerMissionBatchAction(missionId: string, filters: { bairro?: string; role?: string }) {
    try {
        let query: any = firestore.collection('users');

        if (filters.bairro && filters.bairro !== 'all') {
            query = query.where('bairro', '==', filters.bairro);
        }
        if (filters.role && filters.role !== 'all') {
            query = query.where('role', '==', filters.role);
        }

        const snapshot = await query.get();
        const promises = snapshot.docs.map(doc => 
            MissionService.triggerMissionForUser(doc.id, missionId)
        );

        await Promise.all(promises);
        revalidatePath('/dashboard/admin/ai');
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        return { error: error.message };
    }
}
