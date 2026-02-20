
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '@/lib/firebase';

interface CreateLeaderData {
    uid: string;
    displayName: string;
}

export const createMinimumLeader = async ({ uid, displayName }: CreateLeaderData): Promise<void> => {
    try {
        const leaderRef = doc(firestore, 'leaders', uid);
        await setDoc(leaderRef, {
            id: uid,
            name: displayName,
            cityId: null,
            role: 'sub',
            createdAt: serverTimestamp(),
            experience: '',
            memberCount: 0,
        });
    } catch (err: any) {
        console.error('[SERVICE ERROR]', {
            file: 'createLeader.ts',
            function: 'createMinimumLeader',
            error: err.message,
        });
        throw err;
    }
};
