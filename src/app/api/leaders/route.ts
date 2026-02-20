import { NextResponse } from 'next/server';
import { getAllLeaders } from '@/services/leader/getAllLeaders';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leaders = await getAllLeaders();
    return NextResponse.json(leaders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaders' }, { status: 500 });
  }
}
