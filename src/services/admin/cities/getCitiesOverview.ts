'use server';

import { firestore } from '@/lib/firebase-admin';

export interface CityOverviewStats {
    leaders: number;
    supporters: number;
    votePotential: number;
    demandasAbertas: number;
    demandasTotal: number;
    engajamento7d: number;
}

export async function getCitiesOverview(): Promise<Record<string, CityOverviewStats>> {
    try {
        const stats: Record<string, CityOverviewStats> = {};

        const [usersSnap, membersSnap, chamadosSnap] = await Promise.all([
            firestore.collection('users').where('role', 'in', ['leader', 'admin']).get().catch(() => null),
            firestore.collection('community-members').get().catch(() => null),
            firestore.collection('chamados').get().catch(() => null),
        ]);

        // Ensure cities exists in the record
        const ensureCity = (cityId: string) => {
            if (!stats[cityId]) {
                stats[cityId] = {
                    leaders: 0,
                    supporters: 0,
                    votePotential: 0,
                    demandasAbertas: 0,
                    demandasTotal: 0,
                    engajamento7d: 0,
                };
            }
        };

        // 1. Process Leaders
        if (usersSnap && !usersSnap.empty) {
            usersSnap.forEach((doc) => {
                const data = doc.data();
                const cityId = data.cityId || data.cidadeId || data.city;
                if (cityId) {
                    ensureCity(cityId);
                    stats[cityId].leaders += 1;
                }
            });
        }

        // 2. Process Members
        if (membersSnap && !membersSnap.empty) {
            membersSnap.forEach((doc) => {
                const data = doc.data();
                const cityId = data.cityId || data.cidadeId || data.city;
                if (cityId) {
                    ensureCity(cityId);
                    stats[cityId].supporters += 1;
                    const votePotential = parseInt(data.expectedVotes || data.potentialVotes || '0', 10);
                    if (!isNaN(votePotential)) {
                        stats[cityId].votePotential += votePotential;
                    }
                }
            });
        }

        // 3. Process Chamados (Demandas)
        if (chamadosSnap && !chamadosSnap.empty) {
            chamadosSnap.forEach((doc) => {
                const data = doc.data();
                const cityId = data.cityId || data.cidadeId || data.city;
                if (cityId) {
                    ensureCity(cityId);
                    stats[cityId].demandasTotal += 1;
                    if (data.status === 'aberto' || data.status === 'open') {
                        stats[cityId].demandasAbertas += 1;
                    }
                }
            });
        }

        return stats;
    } catch (error) {
        console.error('Error fetching cities overview metrics:', error);
        return {};
    }
}
