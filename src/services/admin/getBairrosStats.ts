import { firestore } from '@/lib/firebase-admin';

export interface BairroStat {
    bairro: string;
    totalVotePotential: number;
}

export async function getBairrosStats(): Promise<BairroStat[]> {
    try {
        const [leadersSnapshot, membersSnapshot] = await Promise.all([
            firestore.collection('users').where('role', 'in', ['leader', 'lider', 'master', 'sub']).get(),
            firestore.collection('members').get(),
        ]);

        // Map leaderId -> bairro
        const leaderBairros: Record<string, string> = {};
        leadersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.bairro) {
                leaderBairros[doc.id] = data.bairro.trim();
            }
        });

        // Aggregate vote potentials by bairro
        const bairroTotals: Record<string, number> = {};

        membersSnapshot.forEach((doc) => {
            const data = doc.data();
            const leaderId = data.leaderId;
            if (leaderId && leaderBairros[leaderId]) {
                const bairro = leaderBairros[leaderId];
                let votePotential = 0;
                if (typeof data.votePotential === 'number') {
                    votePotential = data.votePotential;
                } else if (typeof data.votePotential === 'string') {
                    votePotential = parseInt(data.votePotential, 10) || 0;
                }

                if (bairroTotals[bairro]) {
                    bairroTotals[bairro] += votePotential;
                } else {
                    bairroTotals[bairro] = votePotential;
                }
            }
        });

        // Convert to array and sort by totalVotePotential descending
        const result: BairroStat[] = Object.keys(bairroTotals).map((bairro) => ({
            bairro,
            totalVotePotential: bairroTotals[bairro]
        }));

        result.sort((a, b) => b.totalVotePotential - a.totalVotePotential);

        // Take top 15 to avoid cluttering the chart
        return result.slice(0, 15);
    } catch (error) {
        console.error('Error fetching bairro stats:', error);
        return [];
    }
}
