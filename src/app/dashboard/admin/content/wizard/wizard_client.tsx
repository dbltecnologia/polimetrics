'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

type WizardResponse = {
  text: string;
  image: { imageUrl: string; promptUsed: string };
  voiceScript: string;
  voiceAudioBase64: string;
  meta: Record<string, any>;
};

const quickPresets = [
  {
    label: 'Reunião de bairro',
    objective: 'Convocar reunião de bairro para discutir segurança e limpeza',
    keywords: 'segurança, limpeza, bairro, participação',
    audience: 'moradores do bairro',
    cta: 'Confirme presença e traga 1 vizinho',
    tone: 'comunitario',
  },
  {
    label: 'Missão de cadastro',
    objective: 'Aumentar cadastros de novos apoiadores na semana',
    keywords: 'cadastro, membros, missão, engajamento',
    audience: 'líderes e novos apoiadores',
    cta: 'Cadastre 3 novos membros e compartilhe o link',
    tone: 'direto',
  },
  {
    label: 'Evento porta a porta',
    objective: 'Mobilizar para ação porta a porta no fim de semana',
    keywords: 'porta a porta, visitas, comunidade, apoio',
    audience: 'moradores do bairro',
    cta: 'Participe da ação e registre 5 conversas',
    tone: 'inspirador',
  },
];

export default function WizardClient() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState('comunidade, reunião, missão');
  const [audience, setAudience] = useState('moradores e lideranças locais');
  const [objective, setObjective] = useState('Mobilizar para a próxima reunião de bairro e aumentar participação em missões');
  const [cta, setCta] = useState('Participe da reunião e convide 3 pessoas da sua rede');
  const [tone, setTone] = useState('comunitario');
  const [format, setFormat] = useState<'1:1' | '16:9'>('1:1');
  const [voiceId, setVoiceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<WizardResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [debug, setDebug] = useState<string>('');

  const applyPreset = (preset: typeof quickPresets[number]) => {
    setObjective(preset.objective);
    setKeywords(preset.keywords);
    setAudience(preset.audience);
    setCta(preset.cta);
    setTone(preset.tone);
    setFormat('1:1');
    toast({ title: 'Preset aplicado', description: preset.label });
  };

  const runWizard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          audience,
          objective,
          cta,
          tone,
          format,
          voiceId: voiceId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao gerar kit.');
      }
      const data = await res.json();
      setResp(data);
      setDebug(JSON.stringify(data, null, 2));
      toast({ title: 'Kit gerado', description: 'Briefing, arte e áudio prontos.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível gerar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveKit = async () => {
    if (!resp || !resp.text) {
      toast({ title: 'Gere o kit antes de salvar.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const audioBase64 = resp.voiceAudioBase64;
      const featuredImageUrl = resp.image?.imageUrl;
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: objective || 'Campanha gerada por IA',
          content: resp.text,
          status: 'draft',
          featuredImageUrl,
          audioBase64,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao salvar kit.');
      }
      toast({ title: 'Kit salvo', description: 'Rascunho guardado no CMS.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível salvar.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar kit de campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickPresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Palavras-chave (vírgula)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Público</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="comunitario, inspirador, direto" />
          </div>
          <div className="space-y-2">
            <Label>CTA</Label>
            <Textarea value={cta} onChange={(e) => setCta(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Formato da arte</Label>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as '1:1' | '16:9')}
            >
              <option value="1:1">Quadrado (1:1)</option>
              <option value="16:9">Retangular (16:9)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Voz (opcional)</Label>
            <Input value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="ex: eleven_monolingual_v1" />
            <p className="text-xs text-muted-foreground">Use um voiceId válido do ElevenLabs ou deixe vazio para padrão.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={runWizard} disabled={loading}>
            {loading ? 'Gerando kit...' : 'Gerar kit completo (texto + arte + áudio)'}
          </Button>
          {resp && (
            <Button onClick={saveKit} disabled={saving}>
              {saving ? 'Salvando kit...' : 'Salvar kit como rascunho'}
            </Button>
          )}
        </div>

        {resp && (
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Briefing e posts</Label>
              <Textarea value={resp.text || ''} onChange={(e) => setResp({ ...resp, text: e.target.value })} rows={12} />
            </div>

            <div className="space-y-2">
              <Label>Arte gerada</Label>
              <img src={resp.image?.imageUrl} alt="Arte gerada" className="w-full rounded-md border" />
              <p className="text-xs text-muted-foreground">Prompt: {resp.image?.promptUsed}</p>
              <a href={resp.image?.imageUrl} download="arte-campanha.png" className="text-sm text-blue-600 hover:underline">
                Baixar imagem
              </a>
            </div>

            <div className="space-y-2">
              <Label>Script de áudio</Label>
              <Textarea value={resp.voiceScript || ''} onChange={(e) => setResp({ ...resp, voiceScript: e.target.value })} rows={6} />
            </div>

            <div className="space-y-2">
              <Label>Áudio gerado</Label>
              <audio controls src={`data:audio/mp3;base64,${resp.voiceAudioBase64}`} className="w-full" />
              <a
                href={`data:audio/mp3;base64,${resp.voiceAudioBase64}`}
                download="convite-campanha.mp3"
                className="text-sm text-blue-600 hover:underline"
              >
                Baixar áudio
              </a>
            </div>

            <div className="space-y-2">
              <Label>Depuração da resposta (json)</Label>
              <Textarea value={debug} readOnly rows={8} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
