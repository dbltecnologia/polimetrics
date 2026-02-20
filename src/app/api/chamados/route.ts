import { NextResponse } from 'next/server';
import { getAllChamados } from '@/services/chamadosService';
import { isAuthenticated } from '@/lib/auth/server-side';
import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { resolveUserRole } from '@/lib/user-role';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chamados = await getAllChamados();
    return NextResponse.json(chamados);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chamados' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const subject = (body?.subject || '').trim();
    const message = (body?.message || '').trim();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Assunto e mensagem são obrigatórios.' }, { status: 400 });
    }

    const roleData = await resolveUserRole({
      uid: user.uid,
      customClaims: user.customClaims as Record<string, any> | undefined,
      fallbackName: user.displayName || user.email || 'Usuário',
    });

    const payload = {
      subject,
      message,
      leaderId: user.uid,
      leaderName: roleData.name,
      leaderRole: roleData.role,
      cityId: roleData.leader?.cityId || null,
      email: user.email || null,
      createdAt: FieldValue.serverTimestamp(),
      status: 'aberto',
    };

    const docRef = await firestore.collection('chamados').add(payload);
    const doc = await docRef.get();

    return NextResponse.json({ id: docRef.id, ...doc.data() }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chamados] erro:', error);
    return NextResponse.json({ error: 'Falha ao registrar chamado.' }, { status: 500 });
  }
}
