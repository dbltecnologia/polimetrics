'use server';

import { firestore } from '@/lib/firebase-admin';

// All roles that represent field leaders (not 'admin')
const LEADER_ROLES = ['leader', 'lider', 'master', 'sub'];

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
    const [leadersSnapshot, membersSnapshot, pollsSnapshot] = await Promise.all([
      firestore.collection('users').where('role', 'in', LEADER_ROLES).get(),
      firestore.collection('members').get(),
      firestore.collection('polls').where('status', '==', 'active').get(),
    ]);

    let totalVotePotential = 0;
    membersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalVotePotential += Number(data.votePotential) || 0;
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
