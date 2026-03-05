'use server';

import { firestore } from '@/lib/firebase-admin';
import { serializeCollection } from '@/lib/firestore-serializers';
import { AppUser } from '@/types/user';

const LEADER_ROLES = ['leader', 'lider', 'master', 'sub'];

/**
 * Fetches all users with a leader role.
 */
export async function getLeaders(): Promise<AppUser[]> {
  try {
    const snapshot = await firestore
      .collection('users')
      .where('role', 'in', LEADER_ROLES)
      .get();

    if (snapshot.empty) return [];

    return serializeCollection(snapshot) as AppUser[];
  } catch (error) {
    console.error("Error fetching leaders:", error);
    return [];
  }
}
