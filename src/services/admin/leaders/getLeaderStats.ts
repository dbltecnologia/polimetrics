
'use server';

import { firestore } from '@/lib/firebase-admin';

export interface LeaderStats {
  id: string;
  name: string;
  phone: string | null;
  status: 'ativo' | 'inativo';
  memberCount: number;
}

// Helper function to create a map from a snapshot
const createCountMap = (snapshot: FirebaseFirestore.QuerySnapshot, field: string): Map<string, number> => {
  const map = new Map<string, number>();
  snapshot.forEach(doc => {
    const key = doc.data()[field];
    if (key) {
      map.set(key, (map.get(key) || 0) + 1);
    }
  });
  return map;
};

/**
 * Fetches all leaders and aggregates their member, action, and completed mission counts.
 * This is an optimized approach to avoid N+1 queries.
 * @returns A promise that resolves to an array of LeaderStats objects.
 */
export async function getLeaderStats(): Promise<LeaderStats[]> {
  try {
    // 1. Fetch all data in parallel
    const [
      leadersSnapshot,
      membersSnapshot,
    ] = await Promise.all([
      firestore.collection('users').where('role', '==', 'lider').get(),
      firestore.collection('community-members').select('leaderId').get(),
    ]);

    // 2. Create count maps from the collections
    const memberCountMap = createCountMap(membersSnapshot, 'leaderId');

    if (leadersSnapshot.empty) {
      return [];
    }

    // 3. Combine the data
    const leaderStats: LeaderStats[] = leadersSnapshot.docs.map(doc => {
      const leaderId = doc.id;
      const leaderData = doc.data();

      return {
        id: leaderId,
        name: leaderData.name || 'Nome não informado',
        phone: leaderData.phone || null,
        status: leaderData.status || 'ativo',
        memberCount: memberCountMap.get(leaderId) || 0,
      };
    });

    return leaderStats;

  } catch (error) {
    console.error("Error fetching leader statistics:", error);
    return [];
  }
}
