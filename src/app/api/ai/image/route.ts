export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { generateImage } from '@/services/ai/providers';

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
    const { prompt, provider = 'gemini', size = '1024x1024' } = body || {};
    if (!prompt) return NextResponse.json({ error: 'Prompt é obrigatório.' }, { status: 400 });

    const result = await generateImage({ prompt, provider, size });
    return NextResponse.json({ ...result, debug: { providerUsed: provider } });
  } catch (err) {
    console.error('[POST /api/ai/image] erro:', err);
    return NextResponse.json({ error: 'Falha ao gerar imagem.', details: (err as any)?.message }, { status: 500 });
  }
}
