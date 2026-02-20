"use server";

import { firestore } from '@/lib/firebase-admin';

export async function countMembersByLeader(leaderId: string): Promise<number> {
  try {
    const snapshot = await firestore.collection('members').where('leaderId', '==', leaderId).get();
    return snapshot.size;
  } catch (error) {
    console.error('[SERVICE_ERROR] Error counting members by leader:', error);
    return 0;
  }
}
