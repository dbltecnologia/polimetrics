import { firestore } from '@/lib/firebase-admin';
import { getSelectedState } from '@/lib/selected-state';

export interface AdminStats {
  totalLeaders: number;
  totalMembers: number;
  totalVotePotential: number;
  activePolls: number;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const state = await getSelectedState();
    let cityIds: string[] = [];

    if (state) {
      const citiesSnapshot = await firestore.collection('cities').where('state', '==', state).get();
      cityIds = citiesSnapshot.docs.map(d => d.id);

      if (cityIds.length === 0) {
        return { totalLeaders: 0, totalMembers: 0, totalVotePotential: 0, activePolls: 0 };
      }
    }

    let totalLeaders = 0;
    let totalMembers = 0;
    let totalVotePotential = 0;

    const leaderRoles = ['leader', 'lider', 'master', 'sub'];

    if (state && cityIds.length > 0) {
      // Chunked queries to avoid the 30 disjunctions limit
      const leaderCityChunks = chunkArray(cityIds, 7); // 7 * 4 roles = 28 < 30
      const memberCityChunks = chunkArray(cityIds, 30);

      const leaderPromises = leaderCityChunks.map(chunk =>
        firestore.collection('users')
          .where('role', 'in', leaderRoles)
          .where('cityId', 'in', chunk)
          .get()
      );

      const memberPromises = memberCityChunks.map(chunk =>
        firestore.collection('members')
          .where('cityId', 'in', chunk)
          .get()
      );

      const [leaderSnapshots, memberSnapshots] = await Promise.all([
        Promise.all(leaderPromises),
        Promise.all(memberPromises)
      ]);

      leaderSnapshots.forEach(snap => totalLeaders += snap.size);

      memberSnapshots.forEach(snap => {
        totalMembers += snap.size;
        snap.forEach(doc => {
          const data = doc.data();
          if (typeof data.votePotential === 'number') {
            totalVotePotential += data.votePotential;
          } else if (typeof data.votePotential === 'string') {
            totalVotePotential += parseInt(data.votePotential, 10) || 0;
          }
        });
      });

    } else {
      // No state filter
      const [leadersSnapshot, membersSnapshot] = await Promise.all([
        firestore.collection('users').where('role', 'in', leaderRoles).get(),
        firestore.collection('members').get()
      ]);

      totalLeaders = leadersSnapshot.size;
      totalMembers = membersSnapshot.size;

      membersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (typeof data.votePotential === 'number') {
          totalVotePotential += data.votePotential;
        } else if (typeof data.votePotential === 'string') {
          totalVotePotential += parseInt(data.votePotential, 10) || 0;
        }
      });
    }

    const pollsSnapshot = await firestore.collection('polls').where('status', '==', 'active').get();
    const activePolls = pollsSnapshot.size;

    return { totalLeaders, totalMembers, totalVotePotential, activePolls };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { totalLeaders: 0, totalMembers: 0, totalVotePotential: 0, activePolls: 0 };
  }
}

