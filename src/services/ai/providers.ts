"use server";

/**
 * Serviço de geração de texto via Gemini/OpenAI.
 * Usado exclusivamente pela Secretária Virtual IA.
 */

type GenTextParams = {
  prompt: string;
  provider?: 'openai' | 'gemini';
  model?: string;
};

export async function generateText({ prompt, provider = 'gemini', model }: GenTextParams): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiTextModels = [
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
      if (!resp.ok) continue;
      const data = await resp.json().catch(() => ({}));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
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
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }
  }

  // Fallback seguro em dev/sem chave
  return `⚠️ (fallback) Conteúdo gerado localmente: ${prompt.slice(0, 200)}...`;
}
