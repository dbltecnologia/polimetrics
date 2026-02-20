'use client';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/types/user';

/**
 * Atualiza o perfil de um usuário no Firestore a partir do lado do cliente.
 * 
 * IMPORTANTE: Esta função deve ser usada em um contexto onde as regras de segurança
 * do Firestore garantem que o usuário só pode escrever em seu próprio documento.
 * 
 * @param uid - O ID do usuário a ser atualizado.
 * @param data - Um objeto contendo os campos a serem atualizados.
 * @returns Uma promessa que resolve quando a atualização é concluída.
 */
export async function updateUserProfile(uid: string, data: Partial<AppUser>): Promise<void> {
  if (!uid) {
    throw new Error('UID do usuário é inválido.');
  }

  const userDocRef = doc(db, 'users', uid);

  try {
    // O `updatedAt` é adicionado para rastrear a última modificação.
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Log detalhado para facilitar a depuração no console do navegador.
    console.error("Erro detalhado ao atualizar perfil no Firestore:", error);
    
    // Lança o erro original para que a camada de UI possa tratá-lo.
    throw error;
  }
}
