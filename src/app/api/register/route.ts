import { NextResponse } from 'next/server';
import { registerUser } from '@/services/registerService';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function POST(req: Request) {
  const user = await isAuthenticated();
  if (!user || user.customClaims?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newUser = await registerUser({ name, email, password, role });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('[API ROUTE ERROR - POST /api/register]', { error });
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
