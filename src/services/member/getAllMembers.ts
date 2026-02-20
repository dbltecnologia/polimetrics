"use server";

import { firestore } from '@/lib/firebase-admin';
import { Member } from '@/types/member';

export async function getAllMembers(): Promise<Member[]> {
  try {
    const snapshot = await firestore.collection('members').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Member));
  } catch (error) {
    console.error('[SERVICE_ERROR] Error fetching members:', error);
    return [];
  }
}
