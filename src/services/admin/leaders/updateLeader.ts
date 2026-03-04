'use server';

import { firestore } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { AppUser } from '@/types/user';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/geocode';

/**
 * Updates a user document in the 'users' collection.
 * Optionally updates the Firebase Auth password when provided.
 */
export async function updateLeader(
  id: string,
  data: Partial<AppUser> & { password?: string }
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'ID do líder não fornecido.' };
  }

  try {
    // If a password was provided, update it in Firebase Auth first
    if (data.password && data.password.length >= 6) {
      try {
        await getAuth().updateUser(id, { password: data.password });
      } catch (authError: any) {
        console.error(`Erro ao atualizar senha do líder ${id}:`, authError);
        return { success: false, message: `Erro ao atualizar senha: ${authError.message}` };
      }
    }

    // Remove password from Firestore data (never store plain passwords)
    const { password: _pwd, ...firestoreData } = data;

    // Auto-geocode when address fields are present but lat/lng are missing
    let geoUpdate: { lat?: number; lng?: number } = {};
    const addressParts = [firestoreData.address, firestoreData.bairro, (firestoreData as any).cityName].filter(Boolean);
    if (addressParts.length > 0 && !firestoreData.lat) {
      const coords = await geocodeAddress(addressParts.join(', ') + ', Brasil');
      if (coords) geoUpdate = coords;
    }

    const userRef = firestore.collection('users').doc(id);

    const dataToUpdate = {
      ...firestoreData,
      ...geoUpdate,
      updatedAt: new Date(),
    };

    await userRef.update(dataToUpdate);

    revalidatePath('/dashboard/admin/leaders');
    revalidatePath(`/dashboard/admin/leaders/${id}`);

    return { success: true, message: 'Líder atualizado com sucesso!' };

  } catch (error: any) {
    console.error(`Erro ao atualizar líder com ID "${id}":`, error);
    return { success: false, message: error.message || 'Falha ao atualizar o líder.' };
  }
}
