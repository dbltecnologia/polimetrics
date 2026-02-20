
'use server';

import { firestore } from '@/lib/firebase-admin';

export interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    dateTime: Date;
    attendees: string[];
    capacity?: number;
}

/**
 * Fetches all events created by a specific leader.
 * @param leaderId The ID of the leader.
 * @returns A promise that resolves to an array of events.
 */
export async function getEventsByLeader(leaderId: string): Promise<Event[]> {
    if (!leaderId) return [];

    try {
        const eventsSnapshot = await firestore
            .collection('events')
            .where('leaderId', '==', leaderId)
            .orderBy('dateTime', 'desc')
            .get();

        if (eventsSnapshot.empty) {
            return [];
        }

        const events: Event[] = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Firestore timestamp to Date object
                dateTime: data.dateTime.toDate(), 
            } as Event;
        });

        return events;

    } catch (error) {
        console.error("Error fetching leader events:", error);
        return [];
    }
}
