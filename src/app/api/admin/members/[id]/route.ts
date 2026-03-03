import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { firestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// PATCH — Update a member
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const memberId = resolvedParams.id;
        if (!memberId) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        const body = await request.json();

        const memberRef = firestore.collection('members').doc(memberId);
        const memberDoc = await memberRef.get();

        if (!memberDoc.exists) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        await memberRef.update({
            ...body,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Membro atualizado com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar membro:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE — Remove a member
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const memberId = resolvedParams.id;
        if (!memberId) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        await firestore.collection('members').doc(memberId).delete();

        return NextResponse.json({ success: true, message: 'Membro excluído com sucesso.' });

    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
