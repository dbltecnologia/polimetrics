
'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export type LeaderStatus = 'pending' | 'approved' | 'rejected';

export interface LeaderProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    community: string;
    status: LeaderStatus;
    totalPoints: number;
    createdAt: Date;
    memberCount: number; // Aggregated data
    eventCount: number;  // Aggregated data
}

/**
 * Fetches all users with the 'leader' role.
 */
export async function getLeaders(): Promise<Omit<LeaderProfile, 'memberCount' | 'eventCount'>[]> {
    try {
        const snapshot = await firestore.collection('users').where('role', '==', 'leader').get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                phone: data.phone || 'N/A',
                community: data.community || 'N/A',
                status: data.status || 'pending',
                totalPoints: data.totalPoints || 0,
                createdAt: data.createdAt.toDate(),
            };
        });
    } catch (error) {
        console.error("Error fetching leaders:", error);
        return [];
    }
}

/**
 * Updates the status of a leader.
 */
export async function updateLeaderStatus(leaderId: string, status: LeaderStatus): Promise<{ success: boolean; error: string | null }> {
    try {
        await firestore.collection('users').doc(leaderId).update({ status });
        // In a real app, you might want to send a notification to the user here.
        revalidatePath('/dashboard/admin/leaders'); // Re-renders the leaders list page
        return { success: true, error: null };
    } catch (error) {
        console.error(`Error updating leader ${leaderId} status:`, error);
        return { success: false, error: "Falha ao atualizar o status do líder." };
    }
}

/**
 * Fetches a detailed profile of a single leader, including their members and events.
 */
export async function getLeaderProfile(leaderId: string): Promise<LeaderProfile | null> {
    try {
        const leaderDoc = await firestore.collection('users').doc(leaderId).get();
        if (!leaderDoc.exists) return null;

        // Fetch aggregated data
        const membersPromise = firestore.collection('members').where('leaderId', '==', leaderId).count().get();
        const eventsPromise = firestore.collection('events').where('leaderId', '==', leaderId).count().get();

        const [membersCountResult, eventsCountResult] = await Promise.all([membersPromise, eventsPromise]);

        const data = leaderDoc.data()!;
        return {
            id: leaderDoc.id,
            name: data.name,
            email: data.email,
            phone: data.phone || 'N/A',
            community: data.community || 'N/A',
            status: data.status || 'pending',
            totalPoints: data.totalPoints || 0,
            createdAt: data.createdAt.toDate(),
            memberCount: membersCountResult.data().count,
            eventCount: eventsCountResult.data().count,
        };

    } catch (error) {
        console.error(`Error fetching profile for leader ${leaderId}:`, error);
        return null;
    }
}
