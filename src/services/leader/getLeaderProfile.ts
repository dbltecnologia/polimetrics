import { firestore } from '@/lib/firebase-admin';
import { Leader } from '@/types/leader';

// Obter o perfil de um líder específico
export async function getLeaderProfile(leaderId: string): Promise<Leader | null> {
  try {
    const leaderRef = firestore.collection('leaders').doc(leaderId);
    const leaderDoc = await leaderRef.get();

    if (!leaderDoc.exists) {
      console.warn(`Líder com ID ${leaderId} não encontrado.`);
      return null;
    }

    return { id: leaderDoc.id, ...leaderDoc.data() } as Leader;
  } catch (error) {
    console.error("Erro ao buscar perfil do líder:", error);
    throw new Error("Falha ao buscar perfil do líder.");
  }
}
