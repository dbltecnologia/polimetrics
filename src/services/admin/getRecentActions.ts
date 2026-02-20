'use server';

import { firestore } from '@/lib/firebase-admin';

/**
 * Calculates the number of actions recorded in the last 7 days.
 * @returns A promise that resolves to the count of recent actions.
 */
export async function getRecentActions(): Promise<number> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActionsSnapshot = await firestore
      .collection('community_actions')
      .where('data', '>=', sevenDaysAgo)
      .count()
      .get();
      
    return recentActionsSnapshot.data().count;
  } catch (error) {
    console.error("Error fetching recent actions count:", error);
    return 0;
  }
}
