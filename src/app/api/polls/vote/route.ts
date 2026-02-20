import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { firestore } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    const user = await isAuthenticated();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { pollId, optionId } = await req.json();

        if (!pollId || !optionId) {
            return NextResponse.json({ error: 'Faltando pollId ou optionId.' }, { status: 400 });
        }

        const pollRef = firestore.collection('polls').doc(pollId);

        // We use a transaction to safely update the votedBy map
        await firestore.runTransaction(async (transaction) => {
            const pollDoc = await transaction.get(pollRef);
            if (!pollDoc.exists) {
                throw new Error('Enquete não encontrada.');
            }

            const data = pollDoc.data() as any;
            if (data.status !== 'active') {
                throw new Error('A enquete já foi encerrada.');
            }

            const options = data.options || [];
            if (!options.some((o: any) => o.id === optionId)) {
                throw new Error('Opção inválida.');
            }

            const currentlyVotedBy = data.votedBy || {};
            if (currentlyVotedBy[user.uid]) {
                throw new Error('Você já votou nesta enquete.');
            }

            currentlyVotedBy[user.uid] = optionId;
            transaction.update(pollRef, { votedBy: currentlyVotedBy });
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('API /api/polls/vote error:', error);
        return NextResponse.json({ error: error.message || 'Erro ao processar o voto.' }, { status: 500 });
    }
}
