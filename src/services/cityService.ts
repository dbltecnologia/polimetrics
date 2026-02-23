import { firestore } from '@/lib/firebase-admin';
import { City } from '@/types/city';
import { getSelectedState } from '@/lib/selected-state';

// Retorna cidades filtradas pelo estado selecionado no login
export const getAllCities = async (): Promise<City[]> => {
    const state = await getSelectedState();
    let query: FirebaseFirestore.Query = firestore.collection('cities');
    if (state) {
        query = query.where('state', '==', state);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
};