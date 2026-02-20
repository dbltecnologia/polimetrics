'use server';

import { firestore } from '@/lib/firebase-admin';
import { serializeCollection } from '@/lib/firestore-serializers';
import { AppUser } from '@/types/user';

/**
 * Fetches leaders by getting all users and filtering them in the code.
 * This is a diagnostic approach to bypass any potential Firestore query/indexing issues.
 * @returns A promise that resolves to an array of AppUser objects.
 */
export async function getLeaders(): Promise<AppUser[]> {
  try {
    console.log('Executing getLeaders with diagnostic method: fetching all users.');
    
    // Diagnostic Step: Fetch all documents from the 'users' collection without any filters.
    const allUsersSnapshot = await firestore.collection('users').get();

    if (allUsersSnapshot.empty) {
      console.log('No users found in the collection.');
      return [];
    }

    // Serialize all users into a clean array of objects.
    const allUsers = serializeCollection(allUsersSnapshot);
    console.log(`Found ${allUsers.length} total users.`);

    // Filter the results in the application code.
    const leaderRoles = ['leader', 'lider', 'master', 'sub'];
    const filteredLeaders = allUsers.filter(user => user.role && leaderRoles.includes(user.role));
    
    console.log(`Found ${filteredLeaders.length} users with leader roles.`);

    return filteredLeaders as AppUser[];

  } catch (error) {
    console.error("Error fetching leaders with diagnostic method:", error);
    return [];
  }
}
