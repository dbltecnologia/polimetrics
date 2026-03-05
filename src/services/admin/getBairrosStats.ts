import { firestore } from '@/lib/firebase-admin';

export interface BairroStat {
    bairro: string;
    totalVotePotential: number;
}

export async function getBairrosStats(): Promise<BairroStat[]> {
    try {
        // Aggregate vote potential from the 'members' collection directly,
        // using the member's own bairro/neighborhood field (not the leader's bairro).
        const membersSnapshot = await firestore.collection('members').get();

        const bairroTotals: Record<string, number> = {};

        membersSnapshot.forEach((doc) => {
            const data = doc.data();
            // createMember saves as 'bairro'; older records may use 'neighborhood'
            const bairro = (data.bairro || data.neighborhood || '').trim();
            if (!bairro) return;

            const votePotential = Number(data.votePotential) || 0;
            bairroTotals[bairro] = (bairroTotals[bairro] || 0) + votePotential;
        });

        const result: BairroStat[] = Object.entries(bairroTotals).map(([bairro, totalVotePotential]) => ({
            bairro,
            totalVotePotential,
        }));

        result.sort((a, b) => b.totalVotePotential - a.totalVotePotential);

        // Take top 15 to avoid cluttering the chart
        return result.slice(0, 15);
    } catch (error) {
        console.error('Error fetching bairro stats:', error);
        return [];
    }
}
