'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function deleteCity(cityId: string): Promise<{ success: boolean; message: string }> {
  if (!cityId) {
    return { success: false, message: 'ID da cidade é obrigatório para exclusão.' };
  }

  try {
    const cityRef = firestore.collection('cities').doc(cityId);
    const cityDoc = await cityRef.get();

    if (!cityDoc.exists) {
      return { success: false, message: 'Cidade não encontrada para exclusão.' };
    }

    await cityRef.delete();

    revalidatePath('/dashboard/admin/cities');

    return { success: true, message: 'Cidade excluída com sucesso.' };

  } catch (error: any) {
    console.error(`Erro ao excluir a cidade ${cityId}:`, error);
    return { success: false, message: error.message || 'Falha ao excluir a cidade.' };
  }
}
