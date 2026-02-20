export function buildCampaignPrompt({
  keywords,
  audience,
  tone,
  cta,
  objective,
}: {
  keywords: string[];
  audience: string;
  tone: string;
  cta: string;
  objective: string;
}) {
  return [
    'Você é um estrategista de engajamento comunitário e político.',
    `Objetivo: ${objective}.`,
    `Palavras-chave: ${keywords.join(', ')}.`,
    `Tom: ${tone}. Público: ${audience}.`,
    `Chamada para ação: ${cta}.`,
    'Gere um pacote com:',
    '- Briefing curto (contexto e por que agir).',
    '- Roteiro de reunião com bullets claros.',
    '- 3 posts curtos para WhatsApp/Telegram.',
    '- 3 posts para redes sociais (legendas com CTA).',
    '- Sugestão de slogan ou headline.',
    'Foque em missões, reuniões e mobilização local. Responda em português.',
  ].join('\n');
}

export function buildImagePrompt({
  keywords,
  tone,
  cta,
  format,
}: {
  keywords: string[];
  tone: string;
  cta: string;
  format: '1:1' | '16:9';
}) {
  return [
    'Arte para engajamento comunitário/político.',
    `Formato: ${format}. Tom: ${tone}.`,
    `Palavras-chave: ${keywords.join(', ') || 'comunidade, participação'}.`,
    `CTA: ${cta || 'Participe e compartilhe'}.`,
    'Use estilo limpo, legível, com cores cívicas. Inclua espaço para slogan.',
  ].join('\n');
}

export function buildVoiceScriptPrompt({
  keywords,
  audience,
  cta,
}: {
  keywords: string[];
  audience: string;
  cta: string;
}) {
  return [
    'Crie um script curto (15-30 segundos) para áudio de convite.',
    `Palavras-chave: ${keywords.join(', ')}.`,
    `Público: ${audience}.`,
    `CTA: ${cta}.`,
    'Mantenha o tom próximo, comunitário, direto. Em português.',
  ].join('\n');
}
