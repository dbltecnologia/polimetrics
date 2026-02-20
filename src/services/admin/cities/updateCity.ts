'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

interface UpdateCityData {
  name?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export async function updateCity(cityId: string, data: UpdateCityData): Promise<{ success: boolean; message: string }> {
  if (!cityId) {
    return { success: false, message: 'ID da cidade é obrigatório.' };
  }

  try {
    const cityRef = firestore.collection('cities').doc(cityId);
    const cityDoc = await cityRef.get();

    if (!cityDoc.exists) {
      return { success: false, message: 'Cidade não encontrada.' };
    }

    await cityRef.update({
      ...data,
      updatedAt: new Date(),
    });

    revalidatePath('/dashboard/admin/cities');
    revalidatePath(`/dashboard/admin/cities/edit/${cityId}`);

    return { success: true, message: 'Cidade atualizada com sucesso.' };

  } catch (error: any) {
    console.error(`Erro ao atualizar a cidade ${cityId}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar a cidade.' };
  }
}
