'use server';

import { firestore } from '@/lib/firebase-admin';

export interface LeaderStats {
    totalMembers: number;
    vulnerableMembersCount: number;
    totalActionsLast30Days: number;
    totalMissionsLogged: number;
}

export async function getLeaderDashboardStats(leaderId: string): Promise<LeaderStats> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Total de membros e membros vulneráveis
        const membersSnapshot = await firestore.collection('members').where('leaderId', '==', leaderId).get();
        const totalMembers = membersSnapshot.size;
        let vulnerableMembersCount = 0;
        membersSnapshot.forEach(doc => {
            if (doc.data().status === 'vulnerable') {
                vulnerableMembersCount++;
            }
        });

        // 2. Total de missões registradas pelo líder
        const missionsLogSnapshot = await firestore.collection('mission_logs').where('leaderId', '==', leaderId).get();
        const totalMissionsLogged = missionsLogSnapshot.size;

        // 3. Ações (visitas/notas) nos últimos 30 dias (Exemplo com a coleção 'actions')
        const actionsSnapshot = await firestore.collection('actions') // Supondo que exista uma coleção 'actions'
            .where('leaderId', '==', leaderId)
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();
        const totalActionsLast30Days = actionsSnapshot.size;


        return {
            totalMembers,
            vulnerableMembersCount,
            totalActionsLast30Days,
            totalMissionsLogged
        };

    } catch (error) {
        console.error(`Erro ao buscar estatísticas para o líder ${leaderId}:`, error);
        // Retorna zero em caso de erro para não quebrar a UI
        return {
            totalMembers: 0,
            vulnerableMembersCount: 0,
            totalActionsLast30Days: 0,
            totalMissionsLogged: 0,
        };
    }
}
