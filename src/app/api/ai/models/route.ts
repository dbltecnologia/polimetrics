export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';

async function listGeminiModels(apiKey: string) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models';
  const resp = await fetch(`${url}?key=${apiKey}`);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gemini list error: ${resp.status} ${text}`);
  }
  const data = await resp.json().catch(() => ({}));
  const models = (data?.models || []).map((m: any) => m?.name).filter(Boolean);
  return models;
}

async function listOpenAIModels(apiKey: string) {
  const resp = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI list error: ${resp.status} ${text}`);
  }
  const data = await resp.json().catch(() => ({}));
  const models = (data?.data || []).map((m: any) => m?.id).filter(Boolean);
  return models;
}

export async function GET() {
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

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const bananaModel = process.env.BANANA_MODEL_KEY;

  const result: Record<string, any> = {};

  if (geminiKey) {
    try {
      result.gemini = {
        models: await listGeminiModels(geminiKey),
      };
    } catch (err: any) {
      result.gemini = { error: err?.message || 'Falha ao listar modelos Gemini.' };
    }
  }

  if (openaiKey) {
    try {
      result.openai = {
        models: await listOpenAIModels(openaiKey),
      };
    } catch (err: any) {
      result.openai = { error: err?.message || 'Falha ao listar modelos OpenAI.' };
    }
  }

  if (bananaModel) {
    result.banana = { modelKey: bananaModel };
  }

  if (!geminiKey && !openaiKey && !bananaModel) {
    return NextResponse.json({ error: 'Nenhum provedor configurado.' }, { status: 400 });
  }

  return NextResponse.json(result);
}
