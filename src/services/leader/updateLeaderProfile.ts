"use server";

import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Leader } from '@/types/leader';

// Atualizar ou criar o perfil de um líder com upsert
export async function updateLeaderProfile(leaderId: string, profileData: Partial<Leader>): Promise<void> {
  try {
    const leaderRef = firestore.collection('leaders').doc(leaderId);
    await leaderRef.set(
      {
        ...profileData,
        updatedAt: FieldValue.serverTimestamp(),
        ...(profileData && Object.keys(profileData).length === 0
          ? {}
          : {}),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Erro ao atualizar perfil do líder:', error);
    throw new Error('Falha ao atualizar perfil.');
  }
}
