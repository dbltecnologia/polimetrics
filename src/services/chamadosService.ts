import { firestore } from '@/lib/firebase-admin';
import { Chamado } from '@/types/chamado';

const normalizeTimestamp = (value: any) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
};

// Retorna todos os chamados
export const getAllChamados = async (): Promise<Chamado[]> => {
  const snapshot = await firestore.collection('chamados').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: normalizeTimestamp((data as any).createdAt),
      updatedAt: normalizeTimestamp((data as any).updatedAt),
    } as Chamado;
  });
};

// Retorna os chamados de um líder específico
export const getChamadosByLeader = async (leaderId: string): Promise<Chamado[]> => {
  const snapshot = await firestore.collection('chamados')
    .where('leaderId', '==', leaderId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: normalizeTimestamp((data as any).createdAt),
      updatedAt: normalizeTimestamp((data as any).updatedAt),
    } as Chamado;
  });
};
