export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { generateText } from '@/services/ai/providers';

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
    const { keywords = [], audience = '', tone = 'comunitario', cta = '', provider = 'gemini', rawPrompt, model } = body || {};

    let prompt: string;
    if (rawPrompt && rawPrompt.trim()) {
      prompt = rawPrompt.trim();
    } else {
      const kws = Array.isArray(keywords) ? keywords : String(keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
      if (!kws.length) {
        return NextResponse.json({ error: 'Informe pelo menos uma palavra-chave.' }, { status: 400 });
      }
      prompt = [
        'Gere um texto engajador para comunidade e política local.',
        `Palavras-chave: ${kws.join(', ')}.`,
        `Tom: ${tone}. Público: ${audience || 'moradores e lideranças locais'}.`,
        `Chamada para ação: ${cta || 'Convidar para reunião/missão e compartilhar com a rede.'}`,
        'Retorne um texto em português, com foco em reuniões, missões e engajamento.',
      ].join(' ');
    }

    const text = await generateText({ prompt, provider, model });

    return NextResponse.json({ text });
  } catch (err) {
    console.error('[POST /api/ai/content] erro:', err);
    return NextResponse.json({ error: 'Falha ao gerar conteúdo.' }, { status: 500 });
  }
}
