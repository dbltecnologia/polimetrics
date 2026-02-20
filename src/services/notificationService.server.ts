"use server";

import { firestore } from '@/lib/firebase-admin';

export async function getAllNotifications() {
  try {
    const snapshot = await firestore.collection('notifications').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[SERVICE_ERROR] Error fetching notifications:', error);
    return [];
  }
}
