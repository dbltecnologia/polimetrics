export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { generateVoice } from '@/services/ai/providers';

export async function POST(request: Request) {
  const user = await isAuthenticated();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });
  if (role !== 'admin' && role !== 'leader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { text, voiceId, model, language } = body || {};
    if (!text) return NextResponse.json({ error: 'Texto é obrigatório.' }, { status: 400 });

    const result = await generateVoice({ text, voiceId, model, language });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/ai/voice] erro:', err);
    return NextResponse.json({ error: 'Falha ao gerar áudio.' }, { status: 500 });
  }
}
