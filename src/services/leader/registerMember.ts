import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Leader } from '@/types/leader';

// Registrar um novo membro e associá-lo a um líder
export async function registerMember(leaderId: string, memberName: string, memberEmail: string): Promise<string> {
  try {
    const memberRef = await firestore.collection('members').add({
      name: memberName,
      email: memberEmail,
      leaderId: leaderId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Atualizar contagem de membros do líder
    const leaderRef = firestore.collection('leaders').doc(leaderId);
    await leaderRef.update({ memberCount: FieldValue.increment(1) });

    return memberRef.id;
  } catch (error) {
    console.error("Erro ao registrar novo membro:", error);
    throw new Error("Falha ao registrar membro.");
  }
}
