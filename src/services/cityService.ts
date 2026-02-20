import { firestore } from '@/lib/firebase-admin';
import { City } from '@/types/city';

// Retorna todas as cidades
export const getAllCities = async (): Promise<City[]> => {
    const snapshot = await firestore.collection('cities').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
};