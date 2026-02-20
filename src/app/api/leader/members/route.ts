import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { firestore } from '@/lib/firebase-admin';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });

  if (role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const snapshot = await firestore
      .collection('members')
      .where('leaderId', '==', user.uid)
      .orderBy('name')
      .limit(300)
      .get();

    const members = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
    return NextResponse.json(members);
  } catch (error) {
    console.error('[api/leader/members] Falha ao buscar membros:', error);
    return NextResponse.json({ error: 'Falha ao buscar membros.' }, { status: 500 });
  }
}

