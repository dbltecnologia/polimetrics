import { firestore } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/ai/conversations
 * Retorna as últimas 50 conversas IA ativas para o painel do admin.
 */
export async function GET() {
    try {
        const snapshot = await firestore
            .collection('ai_conversations')
            .orderBy('updatedAt', 'desc')
            .limit(50)
            .get();

        const conversations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ conversations });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
