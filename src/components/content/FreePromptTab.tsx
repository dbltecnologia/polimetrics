'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

type ModelOption = { id: string; provider: 'gemini' | 'openai' | 'banana' };

export function FreePromptTab() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingModels(true);
      try {
        const res = await fetch('/api/ai/models');
        const data = await res.json();
        const opts: ModelOption[] = [];
        if (data?.gemini?.models) {
          data.gemini.models.forEach((id: string) => opts.push({ id, provider: 'gemini' }));
        }
        if (data?.openai?.models) {
          data.openai.models.forEach((id: string) => opts.push({ id, provider: 'openai' }));
        }
        if (data?.banana?.modelKey) {
          opts.push({ id: data.banana.modelKey, provider: 'banana' });
        }
        setModels(opts);
        if (opts.length) setSelected(opts[0].id);
      } catch (err) {
        toast({ title: 'Erro ao listar modelos', description: (err as any)?.message, variant: 'destructive' });
      } finally {
        setLoadingModels(false);
      }
    };
    load();
  }, [toast]);

  const selectedProvider = useMemo(() => models.find((m) => m.id === selected)?.provider, [models, selected]);

  const generate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Digite um prompt', variant: 'destructive' });
      return;
    }
    if (!selectedProvider) {
      toast({ title: 'Selecione um modelo', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawPrompt: prompt,
          provider: selectedProvider === 'banana' ? 'gemini' : selectedProvider, // texto usa gemini/openai; banana só para imagem
          model: selectedProvider === 'banana' ? undefined : selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar');
      setOutput(data.text || '');
      toast({ title: 'Texto gerado', description: `Modelo: ${selected}` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível gerar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt livre (texto)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr,1fr]">
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Digite qualquer prompt para gerar texto com o modelo escolhido."
            />
          </div>
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select value={selected} onValueChange={setSelected} disabled={loadingModels || !models.length}>
              <SelectTrigger>
                <SelectValue placeholder={loadingModels ? 'Carregando...' : 'Selecione um modelo'} />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={`${m.provider}-${m.id}`} value={m.id}>
                    [{m.provider}] {m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Lista obtida em tempo real de /api/ai/models. Banana só aparece para referência (texto não usa).
            </p>
          </div>
        </div>

        <Button onClick={generate} disabled={loading || loadingModels}>
          {loading ? 'Gerando...' : 'Gerar texto'}
        </Button>

        <div className="space-y-2">
          <Label>Resultado</Label>
          <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={10} />
        </div>
      </CardContent>
    </Card>
  );
}
