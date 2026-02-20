export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('[auth/logout] Failed to clear session cookie:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
