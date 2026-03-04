'use server';

import { firestore } from '@/lib/firebase-admin';

/**
 * Calculates the total number of members.
 * NOTE: Members are stored in the 'members' collection (not 'community-members').
 */
export async function getTotalMembers(): Promise<number> {
  try {
    const membersSnapshot = await firestore.collection('members').count().get();
    return membersSnapshot.data().count;
  } catch (error) {
    console.error("Error fetching total members count:", error);
    return 0;
  }
}
