'use server';

import { firestore } from "@/lib/firebase-admin";
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Busca o número de conclusões para uma missão específica por um líder no dia de hoje.
 * Esta é uma Server Action e pode ser chamada com segurança de componentes de cliente.
 */
export async function getMissionCompletionsToday(leaderId: string, missionId: string): Promise<number> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const snapshot = await firestore.collection('mission_logs')
        .where('leaderId', '==', leaderId)
        .where('missionId', '==', missionId)
        .where('createdAt', '>=', todayStart)
        .where('createdAt', '<=', todayEnd)
        .get();

    return snapshot.size;
}
