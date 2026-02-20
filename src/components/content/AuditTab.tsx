'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

type LogItem = {
  id: string;
  type: 'text' | 'image' | 'voice';
  provider: string;
  model?: string;
  status: 'ok' | 'error';
  message?: string;
  promptSnippet?: string;
  timestamp: string;
};

export function AuditTab() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LogItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/logs', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar logs.');
      setLogs(data.items || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Não foi possível carregar os logs.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle>Auditoria de IA (últimos logs)</CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 rounded-md border">
          <div className="divide-y">
            {logs.length === 0 && <div className="p-3 text-sm text-muted-foreground">Nenhum log capturado ainda.</div>}
            {logs.map((log) => (
              <button
                key={log.id}
                className="w-full text-left p-3 hover:bg-muted/60 transition"
                onClick={() => setSelected(log)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.status === 'ok' ? 'default' : 'destructive'}>{log.status}</Badge>
                    <span className="text-xs rounded-full bg-secondary px-2 py-0.5">{log.type}</span>
                    <span className="text-xs text-muted-foreground">{log.provider}</span>
                    {log.model && <span className="text-xs text-muted-foreground">({log.model})</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-foreground mt-1 line-clamp-2">{log.promptSnippet}</p>
                {log.message && <p className="text-xs text-muted-foreground mt-1">{log.message}</p>}
              </button>
            ))}
          </div>
        </ScrollArea>

        {selected && (
          <div className="space-y-2">
            <Label>Detalhes selecionados</Label>
            <Textarea
              readOnly
              value={[
                `Status: ${selected.status}`,
                `Tipo: ${selected.type}`,
                `Provider: ${selected.provider}`,
                selected.model ? `Modelo: ${selected.model}` : '',
                selected.message ? `Mensagem: ${selected.message}` : '',
                `Prompt: ${selected.promptSnippet || ''}`,
                `Timestamp: ${new Date(selected.timestamp).toLocaleString('pt-BR')}`,
              ].filter(Boolean).join('\n')}
              rows={6}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
