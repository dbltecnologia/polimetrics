'use server';

import { firestore } from '@/lib/firebase-admin';
export interface Visit {
    id: string;
    details: string;
    leaderName: string;
    date?: string;
    loggedAt?: string;
    type: 'visit';
}

export async function getVisitsByMember(memberId: string): Promise<Visit[]> {
    try {
        const snapshot = await firestore.collectionGroup('visits')
            .where('memberId', '==', memberId)
            .orderBy('date', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => doc.data() as Visit);

    } catch (error) {
        console.error(`Erro ao buscar visitas para o membro ${memberId}:`, error);
        return [];
    }
}
