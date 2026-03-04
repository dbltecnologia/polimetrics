import { firestore } from '@/lib/firebase-admin';

export interface AdminStats {
  totalLeaders: number;
  totalMembers: number;
  totalVotePotential: number;
  activePolls: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Admin dashboard shows ALL data — no state filter.
    // State filter is only for map views.
    const leaderRoles = ['leader', 'lider', 'master', 'sub', 'admin'];

    const [leadersSnapshot, membersSnapshot, pollsSnapshot] = await Promise.all([
      firestore.collection('users').where('role', 'in', leaderRoles).get(),
      firestore.collection('members').get(),
      firestore.collection('polls').where('status', '==', 'active').get(),
    ]);

    let totalVotePotential = 0;
    membersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.votePotential === 'number') {
        totalVotePotential += data.votePotential;
      } else if (typeof data.votePotential === 'string') {
        totalVotePotential += parseInt(data.votePotential, 10) || 0;
      }
    });

    return {
      totalLeaders: leadersSnapshot.size,
      totalMembers: membersSnapshot.size,
      totalVotePotential,
      activePolls: pollsSnapshot.size,
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { totalLeaders: 0, totalMembers: 0, totalVotePotential: 0, activePolls: 0 };
  }
}
