"use server";

import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function addActivity(activity: {
  leaderId: string;
  supporterId: string;
  cityId: string;
  type: string;
  description: string;
  createdAt?: Date | FieldValue;
}) {
  try {
    await firestore.collection('activities').add({
      ...activity,
      createdAt: activity.createdAt ?? FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('[SERVICE_ERROR] Falha ao criar atividade:', error);
  }
}
