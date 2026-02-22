
'use server';

import { firestore } from '@/lib/firebase-admin';
import { getAllCities } from '@/services/admin/cities/getAllCities';

export interface Member {
    id: string;
    name: string;
    phone: string | null;
    address: string; // Combinação de rua, cidade, estado
    leaderName: string;
    status: 'ativo' | 'inativo' | 'potencial';
    leaderId: string | null;
    cityId?: string | null;
    cityName?: string | null;
    votePotential?: number;
    neighborhood?: string | null;
    street?: string | null;
}

function chunkArray<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

/**
 * Fetches all community members and enriches them with their leader's name.
 */
export async function getAllMembers(): Promise<Member[]> {
    try {
        // Fonte principal: coleção `members` (é onde existe `votePotential` e `cityId`).
        let snapshot = await firestore.collection('members').get().catch(() => null);

        // Fallback: coleção antiga `community-members`.
        const isUsingLegacy = !snapshot || snapshot.empty;
        if (isUsingLegacy) {
            snapshot = await firestore.collection('community-members').get().catch(() => null);
        }
        if (!snapshot || snapshot.empty) return [];

        const cities = await getAllCities().catch(() => []);
        const cityById = new Map(cities.map(c => [c.id, `${c.name} - ${c.state}`]));

        const leaderIds = [...new Set(snapshot.docs.map(doc => (doc.data() as any).leaderId).filter(Boolean))] as string[];
        const leaders: Record<string, string> = {};

        // Firestore `in` possui limite (30). Fazemos em lotes.
        for (const batch of chunkArray(leaderIds, 30)) {
            const usersSnap = await firestore.collection('users').where('__name__', 'in', batch).get().catch(() => null);
            usersSnap?.forEach(doc => {
                leaders[doc.id] = (doc.data() as any).name || 'Líder Desconhecido';
            });
            const leadersSnap = await firestore.collection('leaders').where('__name__', 'in', batch).get().catch(() => null);
            leadersSnap?.forEach(doc => {
                leaders[doc.id] ||= (doc.data() as any).name || 'Líder Desconhecido';
            });
        }

        return snapshot.docs.map(doc => {
            const data = doc.data() as any;
            const address = isUsingLegacy
                ? [data.street, data.city, data.state].filter(Boolean).join(', ')
                : (data.bairro || data.address || '') || 'Endereço não informado';

            const cityId = (data.cityId as string | undefined) || null;
            const votePotential = Number(data.votePotential) || 0;

            return {
                id: doc.id,
                name: data.name || 'Sem nome',
                phone: data.phone || data.whatsapp || null,
                address: address || 'Endereço não informado',
                leaderId: data.leaderId || null,
                leaderName: data.leaderId ? leaders[data.leaderId] : 'Sem líder',
                status: (data.status as any) || 'ativo',
                cityId,
                cityName: cityId ? (cityById.get(cityId) || null) : null,
                votePotential,
                neighborhood: data.neighborhood || data.bairro || null,
                street: data.street || data.rua || null,
            } as Member;
        });

    } catch (error) {
        console.error("Error fetching all members:", error);
        return [];
    }
}
