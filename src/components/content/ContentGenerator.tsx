'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ToneOption = 'inspirador' | 'direto' | 'comunitario';

function buildContent(keywords: string[], tone: ToneOption, audience: string, callToAction: string) {
  const baseIntro = {
    inspirador: 'Juntos, podemos transformar nossa comunidade com ações simples e consistentes.',
    direto: 'Aqui está o que precisamos fazer para engajar nossa base de forma objetiva.',
    comunitario: 'Nossa comunidade cresce quando cada voz participa das decisões.',
  }[tone];

  const bulletList = keywords
    .slice(0, 5)
    .map((kw) => `- ${kw.trim()}: como isso impacta ${audience}`)
    .join('\n');

  return [
    baseIntro,
    `Palavras-chave escolhidas: ${keywords.join(', ')}.`,
    'Pontos de ação focados na comunidade e política local:',
    bulletList,
    callToAction ? `Chamada para ação: ${callToAction}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function ContentGenerator() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState<ToneOption>('comunitario');
  const [audience, setAudience] = useState('moradores e lideranças locais');
  const [cta, setCta] = useState('Participe do mutirão desta semana e compartilhe com sua rede.');
  const [output, setOutput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);

  const parsedKeywords = useMemo(
    () => keywords.split(',').map((kw) => kw.trim()).filter(Boolean),
    [keywords]
  );

  const generate = () => {
    if (!parsedKeywords.length) {
      toast({ title: 'Adicione palavras-chave', description: 'Separe com vírgulas.', variant: 'destructive' });
      return;
    }
    const text = buildContent(parsedKeywords, tone, audience, cta);
    setOutput(text);
  };

  const generateAI = async () => {
    if (!parsedKeywords.length) {
      toast({ title: 'Adicione palavras-chave', description: 'Separe com vírgulas.', variant: 'destructive' });
      return;
    }
    setLoadingAI(true);
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: parsedKeywords,
          audience,
          tone,
          cta,
          provider: 'gemini',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar com IA.');
      }
      const data = await res.json();
      setOutput(data.text || '');
      toast({ title: 'Conteúdo gerado com IA', description: 'Texto adaptado para comunidade e política.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível gerar.', variant: 'destructive' });
    } finally {
      setLoadingAI(false);
    }
  };

  const generateImageAI = async () => {
    if (!output.trim()) {
      toast({ title: 'Gere o texto primeiro', description: 'Crie o conteúdo para orientar a arte.', variant: 'destructive' });
      return;
    }
    setLoadingImage(true);
    try {
      const prompt = `Crie uma arte para redes, voltada para engajamento comunitário e político. Tom: ${tone}. Público: ${audience}. CTA: ${cta}. Use estas palavras-chave: ${parsedKeywords.join(', ')}.`;
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'gemini' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar imagem.');
      }
      const data = await res.json();
      setImageUrl(data.imageUrl);
      toast({ title: 'Arte gerada', description: 'Prévia pronta para download.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível gerar a imagem.', variant: 'destructive' });
    } finally {
      setLoadingImage(false);
    }
  };

  const generateVoiceAI = async () => {
    if (!output.trim()) {
      toast({ title: 'Gere o texto primeiro', description: 'Crie o conteúdo para gerar o áudio.', variant: 'destructive' });
      return;
    }
    setLoadingVoice(true);
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: output }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar áudio.');
      }
      const data = await res.json();
      const url = `data:audio/mp3;base64,${data.audioBase64}`;
      setAudioUrl(url);
      toast({ title: 'Áudio gerado', description: 'Use em convites e lembretes.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível gerar o áudio.', variant: 'destructive' });
    } finally {
      setLoadingVoice(false);
    }
  };

  const saveDraft = async () => {
    if (!title.trim() || !output.trim()) {
      toast({ title: 'Preencha título e gere o conteúdo antes de salvar.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const audioBase64 = audioUrl?.startsWith('data:audio') ? audioUrl.split(',')[1] : undefined;
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: output,
          status: 'draft',
          featuredImageUrl: imageUrl || undefined,
          audioBase64,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao salvar rascunho.');
      }
      toast({ title: 'Rascunho salvo', description: 'Conteúdo guardado para revisão.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível salvar.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const autofill = () => {
    setFormOpen(true);
    setTitle('Mobilização do bairro para mutirão e missão local');
    setKeywords('participação cidadã, segurança do bairro, limpeza comunitária, missão local, reunião de rua');
    setAudience('moradores e lideranças locais');
    setCta('Participe do mutirão desta semana, convide 3 vizinhos e compartilhe nos grupos.');
    setTone('comunitario');
    toast({
      title: 'Campos preenchidos',
      description: 'Exemplo pronto para gerar texto, arte e áudio.',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Gerar conteúdo engajador</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={autofill}>
            Preencher automaticamente
          </Button>
          <Button variant={formOpen ? 'secondary' : 'default'} onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? 'Ocultar formulário' : 'Gerar novo conteúdo'}
          </Button>
        </div>
      </CardHeader>
      {formOpen && (
      <CardContent className="space-y-6">
        <Tabs defaultValue="texto" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="texto">Etapa 1: Texto</TabsTrigger>
            <TabsTrigger value="midia">Etapa 2: Arte + Áudio</TabsTrigger>
            <TabsTrigger value="preview">Prévia & rascunho</TabsTrigger>
          </TabsList>

          <TabsContent value="texto" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mobilização para o bairro" />
              </div>
              <div className="space-y-2">
                <Label>Tom</Label>
                <Select value={tone} onValueChange={(val) => setTone(val as ToneOption)}>
                  <SelectTrigger><SelectValue placeholder="Escolha o tom" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comunitario">Comunitário</SelectItem>
                    <SelectItem value="inspirador">Inspirador</SelectItem>
                    <SelectItem value="direto">Direto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave (separe por vírgula)</Label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="participação cidadã, segurança do bairro, educação"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Público-alvo</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex: moradores do bairro X" />
            </div>

            <div className="space-y-2">
              <Label>Chamada para ação</Label>
              <Textarea
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Ex: Confirme presença na reunião de sábado e compartilhe."
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={generate}>Gerar conteúdo</Button>
              <Button type="button" variant="secondary" onClick={generateAI} disabled={loadingAI}>
                {loadingAI ? 'Gerando...' : 'Gerar com IA (comunitário/político)'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="midia" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use o texto gerado como base para criar arte e áudio. Se ainda não gerou texto, volte na aba anterior.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={generateImageAI} disabled={loadingImage}>
                {loadingImage ? 'Gerando imagem...' : 'Gerar arte (IA)'}
              </Button>
              <Button type="button" variant="outline" onClick={generateVoiceAI} disabled={loadingVoice}>
                {loadingVoice ? 'Gerando áudio...' : 'Gerar áudio (IA)'}
              </Button>
            </div>

            {imageUrl && (
              <div className="space-y-2">
                <Label>Arte gerada (IA)</Label>
                <img src={imageUrl} alt="Arte gerada" className="w-full rounded-md border" />
                <a href={imageUrl} download="arte-ia.png" className="text-sm text-blue-600 hover:underline">Baixar imagem</a>
              </div>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <Label>Áudio gerado (IA)</Label>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label>Prévia gerada</Label>
              <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={10} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={saveDraft} disabled={saving || !output}>
                {saving ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      )}
    </Card>
  );
}
