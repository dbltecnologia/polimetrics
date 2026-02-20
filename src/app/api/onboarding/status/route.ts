export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';

const requiredLeaderFields = ['experience', 'cityId', 'instagram', 'facebook'];

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ needsOnboarding: false }, { status: 401 });
  }

  const { role } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });

  if (role !== 'leader') {
    return NextResponse.json({ needsOnboarding: false });
  }

  const leaderRef = firestore.collection('leaders').doc(user.uid);
  const leaderSnapshot = await leaderRef.get();

  if (!leaderSnapshot.exists) {
    return NextResponse.json({ needsOnboarding: true });
  }

  const leaderData = leaderSnapshot.data() as Record<string, any>;
  const missingField = requiredLeaderFields.some((field) => !leaderData[field]);
  if (missingField) {
    return NextResponse.json({ needsOnboarding: true });
  }

  // Member creation is optional for onboarding completion

  return NextResponse.json({ needsOnboarding: false });
}
