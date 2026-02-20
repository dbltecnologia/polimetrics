"use server";

import { addLog } from '@/lib/ai/logStore';

/**
 * Serviço auxiliar para gerar conteúdo/arte/voz via provedores externos.
 * Implementa chamadas a OpenAI, Gemini e ElevenLabs; se a chave não estiver presente,
 * retorna um fallback seguro para evitar quebra de UX em dev.
 */

type GenTextParams = {
  prompt: string;
  provider?: 'openai' | 'gemini';
  model?: string;
};

type GenImageParams = {
  prompt: string;
  provider?: 'gemini' | 'openai' | 'banana';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
};

type GenVoiceParams = {
  text: string;
  voiceId?: string;
  model?: string;
  language?: string;
};

export async function generateText({ prompt, provider = 'openai', model }: GenTextParams): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiTextModels = [
    // modelo customizado recebido no payload vem primeiro
    model,
    process.env.GEMINI_TEXT_MODEL || 'models/gemini-2.0-flash-exp',
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-pro-latest',
  ];

  if (provider === 'gemini' && geminiKey) {
    for (const modelName of geminiTextModels) {
      if (!modelName) continue;
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!resp.ok) {
        // tenta próximo modelo
        continue;
      }
      const data = await resp.json().catch(() => ({}));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        addLog({ type: 'text', provider: 'gemini', model: modelName, status: 'ok', promptSnippet: prompt.slice(0, 120) });
        return text;
      }
    }
  }

  if (provider === 'openai' && openaiKey) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`OpenAI text error: ${resp.status} ${text}`);
    }
    const data = await resp.json().catch(() => ({}));
    const text = data?.choices?.[0]?.message?.content;
    if (text) {
      addLog({ type: 'text', provider: 'openai', model: model || 'gpt-4o-mini', status: 'ok', promptSnippet: prompt.slice(0, 120) });
      return text;
    }
  }

  // Fallback seguro em dev/sem chave
  addLog({ type: 'text', provider, model, status: 'error', message: 'fallback-local', promptSnippet: prompt.slice(0, 120) });
  return `⚠️ (fallback) Conteúdo gerado localmente: ${prompt.slice(0, 200)}...`;
}

export async function generateImage({
  prompt,
  provider = 'gemini',
  size = '1024x1024',
}: GenImageParams): Promise<{ imageUrl: string; promptUsed: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const bananaKey = process.env.BANANA_API_KEY;
  const bananaModelKey = process.env.BANANA_MODEL_KEY;
  const geminiImageModels = [
    process.env.GEMINI_IMAGE_MODEL || 'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-pro-latest',
  ];

  if (provider === 'gemini' && geminiKey) {
    for (const model of geminiImageModels) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateImage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({ prompt: { text: prompt } }),
        }
      );
      if (!resp.ok) {
        // tenta próximo modelo
        continue;
      }
      const data = await resp.json().catch(() => ({}));
      const img = data?.generatedImages?.[0];
      const inlineBase64 = img?.inlineData?.data || img?.imageBase64;
      const mime = img?.inlineData?.mimeType || 'image/png';
      const url = img?.url || (inlineBase64 ? `data:${mime};base64,${inlineBase64}` : null);
      if (url) {
        addLog({ type: 'image', provider: 'gemini', model, status: 'ok', promptSnippet: prompt.slice(0, 120) });
        return { imageUrl: url, promptUsed: prompt };
      }
    }
  }

  // Banana.dev (nano banana) como alternativa/manual ou fallback
  if ((provider === 'banana' || provider === 'gemini') && bananaKey && bananaModelKey) {
    try {
      const resp = await fetch(process.env.BANANA_API_URL || 'https://api.banana.dev/v2/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: bananaKey,
          modelKey: bananaModelKey,
          modelInputs: { prompt, size },
        }),
      });
      const data = await resp.json().catch(() => ({} as any));
      const out = (data as any)?.modelOutputs?.[0] || {};
      const b64 = out.image_base64 || out.imageBase64 || out.base64;
      const url = out.image_url || out.imageUrl || (b64 ? `data:image/png;base64,${b64}` : null);
      if (url) {
        addLog({ type: 'image', provider: 'banana', model: bananaModelKey, status: 'ok', promptSnippet: prompt.slice(0, 120) });
        return { imageUrl: url, promptUsed: prompt };
      }
    } catch (err) {
      console.error('[banana image] erro', err);
    }
  }

  if (provider === 'openai' && openaiKey) {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`OpenAI image error: ${resp.status} ${text}`);
    }
    const data = await resp.json().catch(() => ({}));
    const url = data?.data?.[0]?.url;
    if (url) {
      addLog({ type: 'image', provider: 'openai', model: 'dall-e-3', status: 'ok', promptSnippet: prompt.slice(0, 120) });
      return { imageUrl: url, promptUsed: prompt };
    }
  }

  // Fallback para OpenAI mesmo quando provider não for openai, se houver chave e ainda não retornamos imagem
  if (provider !== 'openai' && openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          size,
        }),
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const url = data?.data?.[0]?.url;
        if (url) {
          addLog({ type: 'image', provider: 'openai', model: 'dall-e-3', status: 'ok', promptSnippet: prompt.slice(0, 120) });
          return { imageUrl: url, promptUsed: prompt };
        }
      }
    } catch (err) {
      console.error('[openai image fallback] erro', err);
    }
  }

  // Fallback: gerar uma imagem placeholder com prompt embutido
  addLog({ type: 'image', provider, model: 'unknown', status: 'error', message: 'fallback-placeholder', promptSnippet: prompt.slice(0, 120) });
  const placeholder = `https://dummyimage.com/1024x1024/0f172a/ffffff.png&text=${encodeURIComponent(
    prompt.slice(0, 40)
  )}`;
  return { imageUrl: placeholder, promptUsed: prompt };
}

export async function generateVoice({
  text,
  voiceId = 'eleven_monolingual_v1',
  model = 'eleven_multilingual_v2',
  language = 'pt-BR',
}: GenVoiceParams): Promise<{ audioBase64: string }> {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenKey) {
    addLog({ type: 'voice', provider: 'elevenlabs', model, status: 'error', message: 'missing ELEVENLABS_API_KEY', promptSnippet: text.slice(0, 120) });
    return { audioBase64: Buffer.from(`Fallback audio: ${text}`).toString('base64') };
  }

  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': elevenKey,
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.4, similarity_boost: 0.7 },
      language_code: language,
    }),
  });

  const arrayBuffer = await resp.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
  addLog({ type: 'voice', provider: 'elevenlabs', model, status: 'ok', promptSnippet: text.slice(0, 120) });
  return { audioBase64 };
}
