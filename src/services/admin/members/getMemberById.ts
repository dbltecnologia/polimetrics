'use server';

import { firestore } from '@/lib/firebase-admin';
import { Member } from '@/types/member'; // Supondo que o tipo Member foi movido

export async function getMemberById(memberId: string): Promise<Member | null> {
    try {
        const doc = await firestore.collection('members').doc(memberId).get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() } as Member;

    } catch (error) {
        console.error(`Erro ao buscar o membro ${memberId}:`, error);
        return null;
    }
}
