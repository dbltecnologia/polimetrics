import { firestore } from '@/lib/firebase-admin';
import { getSelectedState } from '@/lib/selected-state';

export interface AdminStats {
  totalLeaders: number;
  totalMembers: number;
  totalVotePotential: number;
  activePolls: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const state = await getSelectedState();

    // Se há estado selecionado, pega os cityIds daquele estado para filtrar
    let cityIds: string[] = [];
    if (state) {
      const citiesSnapshot = await firestore.collection('cities').where('state', '==', state).get();
      cityIds = citiesSnapshot.docs.map(d => d.id);
    }

    // Queries paralelas — filtram por estado se disponível
    let leadersQuery: FirebaseFirestore.Query = firestore.collection('users').where('role', 'in', ['leader', 'lider', 'master', 'sub']);
    let membersQuery: FirebaseFirestore.Query = firestore.collection('members');

    if (state && cityIds.length > 0) {
      leadersQuery = leadersQuery.where('cityId', 'in', cityIds);
      membersQuery = membersQuery.where('cityId', 'in', cityIds);
    } else if (state && cityIds.length === 0) {
      // Estado selecionado mas sem cidades cadastradas — retorna zero
      return { totalLeaders: 0, totalMembers: 0, totalVotePotential: 0, activePolls: 0 };
    }

    const [leadersSnapshot, membersSnapshot, pollsSnapshot] = await Promise.all([
      leadersQuery.get(),
      membersQuery.get(),
      firestore.collection('polls').where('status', '==', 'active').get(),
    ]);

    const totalLeaders = leadersSnapshot.size;
    const totalMembers = membersSnapshot.size;
    const activePolls = pollsSnapshot.size;

    let totalVotePotential = 0;
    membersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.votePotential === 'number') {
        totalVotePotential += data.votePotential;
      } else if (typeof data.votePotential === 'string') {
        totalVotePotential += parseInt(data.votePotential, 10) || 0;
      }
    });

    return { totalLeaders, totalMembers, totalVotePotential, activePolls };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { totalLeaders: 0, totalMembers: 0, totalVotePotential: 0, activePolls: 0 };
  }
}

