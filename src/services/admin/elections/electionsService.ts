import { firestore } from '@/lib/firebase-admin';

export interface ElectionRecord {
    id: string;
    year: string;
    totalVotes: number;
    notes?: string;
    createdAt: string;
}

const normalizeTimestamp = (value: any) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    return value;
};

export const getElections = async (): Promise<ElectionRecord[]> => {
    const snapshot = await firestore.collection('elections')
        .orderBy('year', 'asc')
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            totalVotes: Number(data.totalVotes),
            createdAt: normalizeTimestamp(data.createdAt),
        } as ElectionRecord;
    });
};
