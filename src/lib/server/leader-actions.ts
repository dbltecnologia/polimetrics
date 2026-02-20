
import { firestore } from '../firebase-admin'; // CORREÇÃO: Usa a exportação correta 'firestore'
import { Leader } from '@/types/leader';

/**
 * Converte recursivamente Timestamps do Firestore em strings ISO 8601.
 * Isso previne erros de serialização no Next.js.
 */
function serializeTimestamps(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeTimestamps);
  }

  const serialized: { [key: string]: any } = {};
  for (const key in data) {
    serialized[key] = serializeTimestamps(data[key]);
  }
  return serialized;
}


/**
 * Busca todos os líderes diretamente do Firestore.
 * Roda exclusivamente no servidor.
 * @returns Uma promessa que resolve para uma lista de líderes.
 */
export async function getLeadersFromServer(): Promise<Leader[]> {
  console.log('Buscando líderes diretamente do Firestore (lado do servidor)...');
  const leadersSnapshot = await firestore.collection('leaders').get(); // CORREÇÃO: Usa 'firestore'
  
  if (leadersSnapshot.empty) {
    return [];
  }

  const leaders = leadersSnapshot.docs.map(doc => {
    const data = doc.data();
    const serializedData = serializeTimestamps(data);
    return { id: doc.id, ...serializedData } as Leader;
  });

  return leaders;
}
