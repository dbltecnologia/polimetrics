import { firestore } from '@/lib/firebase-admin';
import { Member } from '@/types/member';

type GetMembersByLeaderPaginatedOptions = {
  leaderId: string;
  limit?: number;
  startAfterDoc?: any;
};

function coerceLimit(value: unknown, fallback = 10) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const int = Math.floor(num);
  if (int < 1) return fallback;
  // evita queries gigantes acidentais
  return Math.min(int, 200);
}

// Obter membros por líder com paginação
export async function getMembersByLeaderPaginated(
  leaderIdOrOptions: string | GetMembersByLeaderPaginatedOptions,
  limitCount?: number,
  startAfterDoc?: any
): Promise<{ members: Member[], lastVisible: any }> {
  try {
    const leaderId =
      typeof leaderIdOrOptions === 'string' ? leaderIdOrOptions : leaderIdOrOptions.leaderId;
    const resolvedLimit =
      typeof leaderIdOrOptions === 'string'
        ? coerceLimit(limitCount, 10)
        : coerceLimit(leaderIdOrOptions.limit, 10);
    const resolvedStartAfter =
      typeof leaderIdOrOptions === 'string' ? startAfterDoc : leaderIdOrOptions.startAfterDoc;

    let query = firestore.collection('members')
                        .where('leaderId', '==', leaderId)
                        .orderBy('name')
                        .limit(resolvedLimit);

    if (resolvedStartAfter) {
      // Permite que APIs passem apenas o ID do documento para paginação.
      if (typeof resolvedStartAfter === 'string') {
        const docSnap = await firestore.collection('members').doc(resolvedStartAfter).get();
        if (docSnap.exists) {
          query = query.startAfter(docSnap);
        }
      } else {
        query = query.startAfter(resolvedStartAfter);
      }
    }

    const snapshot = await query.get();
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return { members, lastVisible };
  } catch (error) {
    console.error("Erro ao buscar membros com paginação:", error);
    throw new Error("Falha ao buscar membros.");
  }
}
