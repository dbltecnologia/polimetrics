'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase-admin';
import { UserRole } from '@/types/user';

const leaderRoles: UserRole[] = ['leader', 'master', 'sub'];

interface EnsureLeaderOptions {
  uid: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

export async function ensureLeaderDocument({ uid, name, email, role }: EnsureLeaderOptions) {
  if (!leaderRoles.includes(role as UserRole)) {
    return;
  }

  const leaderRef = firestore.collection('leaders').doc(uid);
  const leaderSnapshot = await leaderRef.get();
  if (leaderSnapshot.exists) {
    return;
  }

  await leaderRef.set({
    id: uid,
    name: name || 'Novo Líder',
    email: email || '',
    role: 'leader',
    cityId: null,
    experience: '',
    instagram: '',
    facebook: '',
    status: 'ativo',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
