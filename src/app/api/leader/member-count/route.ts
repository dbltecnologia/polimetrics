
import { NextResponse } from 'next/server';
import { countMembersByLeader } from '@/services/member/countMembersByLeader';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'uid é obrigatório' }, { status: 400 });
  }

  try {
    const count = await countMembersByLeader(uid);
    return NextResponse.json({ count });
  } catch (err: any) {
    console.error("[SERVICE ERROR]", {
      file: "api/leader/member-count",
      function: "GET",
      error: err.message,
    });
    return NextResponse.json({ error: 'Falha ao contar membros' }, { status: 500 });
  }
}
