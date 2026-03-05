import { firestore } from "@/lib/firebase-admin";

export interface TopLeader {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  community: string | null;
}

// All roles that represent field leaders (not admin/viewer)
const LEADER_ROLES = ['leader', 'lider', 'master', 'sub'];

export async function getTopLeaders(): Promise<TopLeader[]> {
  try {
    const leadersSnapshot = await firestore
      .collection('users')
      .where('role', 'in', LEADER_ROLES)
      .orderBy('totalPoints', 'desc')
      .limit(5)
      .get();

    if (leadersSnapshot.empty) {
      return [];
    }

    const topLeaders: TopLeader[] = leadersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Líder sem nome',
        avatarUrl: data.avatarUrl || null,
        totalPoints: data.totalPoints || 0,
        community: data.community || null,
      };
    });

    return topLeaders;
  } catch (error) {
    console.error("Error fetching top leaders:", error);
    return [];
  }
}
