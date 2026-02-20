import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { firestore } from '@/lib/firebase-admin';

type UserRole = 'admin' | 'leader';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, name, leader } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims,
    fallbackName: user.displayName || '',
  });

  if (role === 'blocked') {
    console.error('[auth/me] Acesso bloqueado para uid=%s', user.uid);
    return NextResponse.json({ error: 'Seu perfil não possui permissão para acessar o painel. Contate o suporte.' }, { status: 403 });
  }

  // Bloqueia líder desativado (status = inativo) de acessar o sistema.
  try {
    const [userDoc, leaderDoc] = await Promise.all([
      firestore.collection('users').doc(user.uid).get(),
      firestore.collection('leaders').doc(user.uid).get(),
    ]);

    const status = (userDoc.exists ? (userDoc.data() as any)?.status : null) as string | null;
    if (role === 'leader' && status === 'inativo') {
      return NextResponse.json({ error: 'Conta desativada.' }, { status: 403 });
    }

    const image =
      user.photoURL ||
      (leaderDoc.exists ? ((leaderDoc.data() as any)?.avatarUrl as string | undefined) : undefined) ||
      (userDoc.exists ? ((userDoc.data() as any)?.avatarUrl as string | undefined) : undefined) ||
      null;

    return NextResponse.json({
      id: user.uid,
      name,
      email: user.email || '',
      role,
      leader,
      image,
    });
  } catch (e) {
    // Se falhar a leitura, não bloqueia por engano; apenas registra.
    console.error('[auth/me] Falha ao verificar status do usuário:', e);
  }

  return NextResponse.json({
    id: user.uid,
    name,
    email: user.email || '',
    role,
    leader,
    image: user.photoURL || null,
  });
}
