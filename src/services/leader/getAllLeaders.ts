"use server";

import { firestore } from '@/lib/firebase-admin';
import { Leader } from '@/types/leader';

function serializeTimestamps(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeTimestamps);
  }

  const serialized: { [key: string]: any } = {};
  for (const key in data) {
    serialized[key] = serializeTimestamps(data[key]);
  }
  return serialized;
}

export async function getAllLeaders(): Promise<Leader[]> {
  try {
    const snapshot = await firestore.collection('leaders').get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = serializeTimestamps(doc.data());
      return { id: doc.id, ...data } as Leader;
    });
  } catch (error) {
    console.error('[SERVICE_ERROR] Failed to fetch leaders:', error);
    return [];
  }
}
