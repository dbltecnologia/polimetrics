'use server';

import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { AppUser } from '@/types/user';

export async function getCurrentUser(): Promise<AppUser | null> {
  const user = await isAuthenticated();
  if (!user) {
    return null;
  }

  const { role, name, leader } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });

  return {
    uid: user.uid,
    email: user.email || '',
    name,
    role,
    leader,
  };
}
