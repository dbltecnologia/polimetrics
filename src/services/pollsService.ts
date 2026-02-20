import { firestore } from '@/lib/firebase-admin';

export interface PollOption {
    id: string;
    text: string;
}

export interface Poll {
    id: string;
    title: string;
    description: string;
    options: PollOption[];
    status: 'active' | 'closed';
    createdAt: string;
    votedBy: Record<string, string>; // userId -> optionId mapping
}

const normalizeTimestamp = (value: any) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    return value;
};

export const getActivePolls = async (): Promise<Poll[]> => {
    const snapshot = await firestore.collection('polls')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            votedBy: data.votedBy || {},
        } as Poll;
    });
};

// Used by Admin
export const getAllPolls = async (): Promise<Poll[]> => {
    const snapshot = await firestore.collection('polls').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: normalizeTimestamp(data.createdAt),
            votedBy: data.votedBy || {}
        } as Poll;
    });
};
