export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { generateText, generateImage, generateVoice } from '@/services/ai/providers';
import { buildCampaignPrompt, buildImagePrompt, buildVoiceScriptPrompt } from '@/lib/ai/prompts';

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
    const {
      objective = 'Mobilizar comunidade para reunião e missão local',
      keywords = [],
      audience = 'moradores e lideranças locais',
      tone = 'comunitario',
      cta = 'Participe da reunião e compartilhe com sua rede',
      format = '1:1',
      voiceId,
    } = body || {};

    const kws = Array.isArray(keywords) ? keywords : String(keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
    if (!kws.length) {
      return NextResponse.json({ error: 'Informe pelo menos uma palavra-chave.' }, { status: 400 });
    }

    // Texto
    const textPrompt = buildCampaignPrompt({ keywords: kws, audience, tone, cta, objective });
    const text = await generateText({ prompt: textPrompt, provider: 'gemini' });

    // Imagem (1:1) com prompt derivado
    const imagePrompt = buildImagePrompt({ keywords: kws, tone, cta, format });
    const size = format === '16:9' ? '1792x1024' : '1024x1024';
    const image = await generateImage({ prompt: imagePrompt, provider: 'gemini', size });

    // Script de voz e áudio
    const voiceScriptPrompt = buildVoiceScriptPrompt({ keywords: kws, audience, cta });
    const voiceScript = await generateText({ prompt: voiceScriptPrompt, provider: 'gemini' });
    const voice = await generateVoice({ text: voiceScript, voiceId });

    return NextResponse.json({
      text,
      image,
      voiceScript,
      voiceAudioBase64: voice.audioBase64,
      meta: { objective, keywords: kws, audience, tone, cta },
    });
  } catch (err) {
    console.error('[POST /api/ai/wizard] erro:', err);
    return NextResponse.json({ error: 'Falha ao gerar kit da campanha.' }, { status: 500 });
  }
}
