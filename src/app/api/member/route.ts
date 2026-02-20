import { NextResponse } from 'next/server';
import { createMember } from '@/services/member/createMember';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function POST(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const memberData = await req.json();
    const newMember = await createMember(memberData);
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
