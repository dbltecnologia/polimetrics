'use server';

import { firestore } from '@/lib/firebase-admin';
import { AppUser } from '@/types/user';
import { revalidatePath } from 'next/cache';

/**
 * Updates a user document in the 'users' collection.
 * @param id The document ID of the user to update.
 * @param data The data to update.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateLeader(id: string, data: Partial<AppUser>): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'ID do líder não fornecido.' };
  }

  try {
    const userRef = firestore.collection('users').doc(id);

    const dataToUpdate: Partial<AppUser> = {
      ...data,
      updatedAt: new Date(), // Always update the timestamp
    };

    await userRef.update(dataToUpdate);

    // Revalidate the path to ensure the list page is updated
    revalidatePath('/dashboard/admin/leaders');
    // Revalidate the specific leader's page as well
    revalidatePath(`/dashboard/admin/leaders/${id}`);

    return { success: true, message: 'Líder atualizado com sucesso!' };

  } catch (error: any) {
    console.error(`Erro ao atualizar líder com ID "${id}":`, error);
    return { success: false, message: error.message || 'Falha ao atualizar o líder.' };
  }
}
