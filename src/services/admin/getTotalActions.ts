'use server';

import { firestore } from '@/lib/firebase-admin';

/**
 * Calculates the total number of actions recorded.
 * @returns A promise that resolves to the total count of actions.
 */
export async function getTotalActions(): Promise<number> {
  try {
    const actionsSnapshot = await firestore.collection('community_actions').count().get();
    return actionsSnapshot.data().count;
  } catch (error) {
    console.error("Error fetching total actions count:", error);
    return 0;
  }
}
