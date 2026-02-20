'use server';

import { firestore } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib/firestore-serializers';
import { AppUser } from '@/types/user';

/**
 * Fetches a single user document from the 'users' collection by its document ID.
 * @param id The document ID of the user to fetch.
 * @returns A promise that resolves to the AppUser object or null if not found.
 */
export async function getLeaderById(id: string): Promise<AppUser | null> {
  if (!id) {
    console.error('Error: ID não fornecido para getLeaderById.');
    return null;
  }

  try {
    const userRef = firestore.collection('users').doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      console.warn(`Líder com o ID "${id}" não foi encontrado na coleção 'users'.`);
      return null;
    }

    return serializeDoc(doc) as AppUser;

  } catch (error) {
    console.error(`Erro ao buscar líder com ID "${id}":`, error);
    // Lançar o erro ou retornar nulo pode depender da estratégia de tratamento de erros do seu app
    return null;
  }
}
