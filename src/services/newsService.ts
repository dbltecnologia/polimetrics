import { firestore } from '@/lib/firebase-admin';
import { News } from '@/types/news';

// Retorna todas as notícias
export const getAllNews = async (): Promise<News[]> => {
    const snapshot = await firestore.collection('news').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as News));
};