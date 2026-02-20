"use server";

'use server';

import { firestore } from '@/lib/firebase-admin';

export type UserRole = 'admin' | 'leader' | 'blocked';

interface ResolveUserRoleOptions {
  uid: string;
  customClaims?: Record<string, any>;
  fallbackName?: string | null;
}

export async function resolveUserRole({
  uid,
  customClaims,
  fallbackName,
}: ResolveUserRoleOptions): Promise<{ role: UserRole; name: string; leader?: { id: string; cityId?: string } }> {
  const [leaderDoc, userDoc] = await Promise.all([
    firestore.collection('leaders').doc(uid).get(),
    firestore.collection('users').doc(uid).get(),
  ]);

  const leaderData = leaderDoc.exists ? leaderDoc.data() : null;
  const userData = userDoc.exists ? userDoc.data() : null;

  const rawClaimRole = (customClaims?.role as string | undefined)?.toLowerCase();
  const directRole = (leaderData?.role as string | undefined)?.toLowerCase();
  const docRole = (userData?.role as string | undefined)?.toLowerCase();

  const adminRoles = ['admin'];
  const leaderRoles = ['leader', 'master', 'sub'];

  const isAdmin =
    adminRoles.includes(rawClaimRole || '') ||
    adminRoles.includes(directRole || '') ||
    adminRoles.includes(docRole || '');

  const isLeader =
    leaderRoles.includes(rawClaimRole || '') ||
    leaderRoles.includes(directRole || '') ||
    leaderRoles.includes(docRole || '');

  const role: UserRole = isAdmin ? 'admin' : isLeader ? 'leader' : 'blocked';
  const name =
    (leaderData?.name as string | undefined) ||
    (userData?.name as string | undefined) ||
    fallbackName ||
    'Usuário';

  const leaderSummary = leaderDoc.exists
    ? {
        id: leaderDoc.id,
        cityId: leaderData?.cityId as string | undefined,
      }
    : undefined;

  if (role === 'blocked') {
    console.error('[resolveUserRole][blocked] uid=%s claimsRole=%s docRole=%s leaderRole=%s', uid, rawClaimRole, docRole, directRole);
  }

  return { role, name, leader: leaderSummary };
}
