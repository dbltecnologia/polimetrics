"use server";

import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function createMember(memberData: Record<string, any>) {
  try {
    const collection = firestore.collection('members');
    const createdDocRef = await collection.add({
      ...memberData,
      createdAt: FieldValue.serverTimestamp(),
    });
    const createdDoc = await createdDocRef.get();
    if (!createdDoc.exists) {
      throw new Error('Failed to retrieve the created member.');
    }
    return { id: createdDoc.id, ...createdDoc.data() };
  } catch (error) {
    console.error('[SERVICE_ERROR] Error creating member:', error);
    throw new Error('Falha ao criar membro.');
  }
}
