import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { UserRecord } from 'firebase-admin/auth';

export async function isAuthenticated(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const user = await auth.getUser(decodedToken.uid);
    return user;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
