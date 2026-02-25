import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { getAuth } from 'firebase-admin/auth';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await isAuthenticated();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = await resolveUserRole({
            uid: user.uid,
            customClaims: user.customClaims as Record<string, any> | undefined,
            fallbackName: user.displayName || '',
        });

        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const leaderId = resolvedParams.id;
        if (!leaderId) {
            return NextResponse.json({ error: 'Missing leader ID' }, { status: 400 });
        }

        // 1. Remover da coleção 'users' (Líder principal)
        await firestore.collection('users').doc(leaderId).delete();

        // 2. Tentar remover a credencial de Acesso Autenticada do Auth
        try {
            const auth = getAuth();
            await auth.deleteUser(leaderId);
        } catch (authError) {
            console.warn(`Aviso: Usuário ${leaderId} não foi encontrado no Firebase Auth ou erro de sinc.`, authError);
            // Nós prosseguimos silenciosamente pois o db principal importava mais e já foi quebrado o vinculo.
        }

        // 3. (Condicional) Limpar ovinculo nos membros associados. Se quisermos hard-delete em massa seria aqui. Para soft-linking, nós limpamos o líder:
        const membersQuery = await firestore.collection('members').where('leaderId', '==', leaderId).get();
        if (!membersQuery.empty) {
            const batch = firestore.batch();
            membersQuery.docs.forEach(doc => {
                batch.update(doc.ref, {
                    leaderId: null, // "Órfão"
                    status: 'inativo', // Desativa a força a contagem de votos dele
                    updatedAt: new Date().toISOString()
                });
            });
            await batch.commit();
        }

        return NextResponse.json({ success: true, message: 'Líder excluído com sucesso' });

    } catch (error) {
        console.error('Erro geral ao excluir líder via API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
