'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

interface CreateCityData {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export async function createCity(data: CreateCityData): Promise<{ success: boolean; message: string }> {
  const { name, state, latitude, longitude } = data;

  if (!name || !state || latitude === undefined || longitude === undefined) {
    return { success: false, message: 'Todos os campos são obrigatórios.' };
  }

  try {
    const newCityRef = firestore.collection('cities').doc();
    
    await newCityRef.set({
      name,
      state,
      latitude,
      longitude,
      createdAt: new Date(),
    });

    revalidatePath('/dashboard/admin/cities');

    return { success: true, message: 'Cidade criada com sucesso.' };

  } catch (error: any) {
    console.error("Erro ao criar nova cidade:", error);
    return { success: false, message: error.message || 'Falha ao criar a cidade.' };
  }
}
