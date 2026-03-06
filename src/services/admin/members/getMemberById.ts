'use server';

import { firestore } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib/firestore-serializers';
import { Member } from '@/types/member';

export async function getMemberById(memberId: string): Promise<Member | null> {
    try {
        const doc = await firestore.collection('members').doc(memberId).get();

        if (!doc.exists) {
            return null;
        }

        // serializeDoc converts Firestore Timestamps to ISO strings so that
        // the returned object can be safely passed to Client Components as props.
        return serializeDoc(doc) as Member;

    } catch (error) {
        console.error(`Erro ao buscar o membro ${memberId}:`, error);
        return null;
    }
}
