
'use server';

import { firestore } from '@/lib/firebase-admin';

// Tipos para as sub-coleções
interface CommunityMember {
    id: string;
    name: string;
    status: string;
}

interface ActivityLog {
    id: string;
    description: string;
    date: string;
    type: 'action' | 'mission';
}

// Tipo para o retorno principal
export interface LeaderDetailsData {
    leader: {
        id: string;
        name: string;
        email: string;
        photoURL?: string;
        phone: string;
        city: string;
        createdAt: string;
    };
    stats: {
        activeMembers: number;
        actionsTaken: number;
        missionsCompleted: number;
        communityPoints: number;
    };
    members: CommunityMember[];
    activityTimeline: ActivityLog[];
    lastAction: ActivityLog | null;
    lastMission: ActivityLog | null;
}

export async function getLeaderDetails(leaderId: string): Promise<LeaderDetailsData | null> {
    try {
        const leaderDoc = await firestore.collection('users').doc(leaderId).get();
        if (!leaderDoc.exists) {
            return null;
        }

        const leaderData = leaderDoc.data()!;

        // Buscas em paralelo
        const [membersSnapshot, actionsSnapshot, missionsSnapshot] = await Promise.all([
            firestore.collection('community-members').where('leaderId', '==', leaderId).get(),
            firestore.collection('community_actions').where('leaderId', '==', leaderId).orderBy('createdAt', 'desc').get(),
            firestore.collection('mission_logs').where('leaderId', '==', leaderId).orderBy('completedAt', 'desc').get(),
        ]);

        // Processamento dos dados
        const members: CommunityMember[] = membersSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            status: doc.data().status || 'active',
        }));

        const actions: ActivityLog[] = actionsSnapshot.docs.map(doc => ({
            id: doc.id,
            description: `Ação comunitária registrada para ${doc.data().memberName}`,
            date: doc.data().createdAt.toDate().toISOString(),
            type: 'action',
        }));

        const missions: ActivityLog[] = missionsSnapshot.docs.map(doc => ({
            id: doc.id,
            description: `Missão concluída: ${doc.data().missionName}`,
            date: doc.data().completedAt.toDate().toISOString(),
            type: 'mission',
        }));

        const activityTimeline = [...actions, ...missions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const communityPoints = (actions.length * 10) + (missions.length * 25); // Exemplo de pontuação

        return {
            leader: {
                id: leaderDoc.id,
                name: leaderData.name,
                email: leaderData.email,
                photoURL: leaderData.photoURL,
                phone: leaderData.phone,
                city: leaderData.city || 'Não informada',
                createdAt: leaderData.createdAt.toDate().toISOString(),
            },
            stats: {
                activeMembers: members.filter(m => m.status === 'active').length,
                actionsTaken: actions.length,
                missionsCompleted: missions.length,
                communityPoints: communityPoints,
            },
            members: members.slice(0, 10), // Limitar para a UI inicial
            activityTimeline: activityTimeline.slice(0, 10),
            lastAction: actions[0] || null,
            lastMission: missions[0] || null,
        };

    } catch (error) {
        console.error("Error fetching leader details:", error);
        return null;
    }
}
