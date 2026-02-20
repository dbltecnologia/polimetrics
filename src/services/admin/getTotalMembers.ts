'use server';

import { firestore } from '@/lib/firebase-admin';

/**
 * Calculates the total number of members across all communities.
 * @returns A promise that resolves to the total count of members.
 */
export async function getTotalMembers(): Promise<number> {
  try {
    const membersSnapshot = await firestore.collection('community-members').count().get();
    return membersSnapshot.data().count;
  } catch (error) {
    console.error("Error fetching total members count:", error);
    return 0;
  }
}
