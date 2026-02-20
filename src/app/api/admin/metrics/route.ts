import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { getAdminCompactMetrics } from '@/services/admin/getAdminCompactMetrics';

export const dynamic = 'force-dynamic'; // EVITA FALHA NO BUILD DO APP HOSTING

export async function GET() {
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

  const metrics = await getAdminCompactMetrics();
  return NextResponse.json(metrics);
}

