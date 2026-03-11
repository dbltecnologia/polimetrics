import { NextResponse } from 'next/server';
import { auth as adminAuth, firestore } from '@/lib/firebase-admin';
import { resolveUserRole } from '@/lib/user-role';
import { cookies } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
        }

        // Verifica que quem aprova é admin
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const { role } = await resolveUserRole({
            uid: decoded.uid,
            customClaims: decoded.claims,
            fallbackName: decoded.name || '',
        });

        if (role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }

        const { id: leaderId } = await params;
        if (!leaderId) {
            return NextResponse.json({ error: 'leaderId obrigatório.' }, { status: 400 });
        }

        // Atualiza status para 'ativo'
        await firestore.collection('users').doc(leaderId).update({
            status: 'ativo',
            approvedAt: new Date(),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Approve leader error:', error);
        return NextResponse.json({ error: 'Erro ao aprovar líder.' }, { status: 500 });
    }
}
