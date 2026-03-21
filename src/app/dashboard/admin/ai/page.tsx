export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContentList } from '@/services/admin/contentService';
import { getActivePolls } from '@/services/pollsService';
import { firestore } from '@/lib/firebase-admin';
import { type ElementType } from 'react';
import {
  Brain,
  Bot,
  Activity,
  Image as ImageIcon,
  Mic2,
  Wand2,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { VirtualSecretaryManager } from './_components/VirtualSecretaryManager';

export default async function AIDashboardExecutivePage() {
  const content = await getContentList();
  const polls = await getActivePolls();
  
  // Buscar missões ativas
  const missionsSnap = await firestore.collection('missions')
    .where('status', '==', 'Ativa')
    .get();
  const missions = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Buscar bairros únicos dos usuários para filtros
  const usersSnap = await firestore.collection('users').get();
  const bairros = Array.from(new Set(
    usersSnap.docs
      .map(d => d.data().bairro)
      .filter(b => !!b)
  )).sort();

  const total = content.length;
  const published = content.filter((c) => c.status === 'published').length;
  const withImage = content.filter((c) => !!c.featuredImageUrl).length;
  const withAudio = content.filter((c) => !!c.audioBase64).length;

  const providerStatus = [
    { name: 'Gemini', ok: !!process.env.GEMINI_API_KEY, details: 'Texto e imagem' },
    { name: 'OpenAI', ok: !!process.env.OPENAI_API_KEY, details: 'Fallback texto/imagem' },
    { name: 'ElevenLabs', ok: !!process.env.ELEVENLABS_API_KEY, details: 'Voz/narração' },
  ];

  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 px-3 md:px-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 px-6 py-6 md:px-10 md:py-10 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-100/80">Painel Executivo de IA</p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-sky-200" /> Secretário Virtual & Gamificação
            </h1>
            <p className="text-sm text-slate-100/90">
              Gerencie a proatividade da IA, disparos de pesquisas e missões de gamificação via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO DO SECRETÁRIO VIRTUAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <MessageSquare className="h-5 w-5 text-sky-600" /> Centro de Comando IA
        </h2>
        <VirtualSecretaryManager polls={polls} missions={missions} bairros={bairros as string[]} />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total de Conteúdos" value={total} subtitle="Gerados por IA" icon={Activity} />
        <StatCard title="Mídia Multimodal" value={`${withImage} artes / ${withAudio} áudios`} subtitle="Outputs gerados" icon={ImageIcon} />
        <StatCard title="Engajamento Geral" value={`${completionRate}%`} subtitle="Taxa de conversão" icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Saúde dos Provedores
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {providerStatus.map((p) => (
              <div key={p.name} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  {p.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                </div>
                <p className="text-xs text-muted-foreground">{p.details}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" /> Alertas de Inatividade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
             A IA monitora líderes de alta influência e avisa você via WhatsApp se houver queda de engajamento (inativo há +30 dias).
          </CardContent>
        </Card>
      </div>

      {/* BASE DE CONHECIMENTO */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Base de Conhecimento (RAG)
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/admin/ai/knowledge">Gerenciar</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Documentos e contextos que o Secretário Virtual usa para responder perguntas com precisão.
          Adicione propostas, histórico do candidato, FAQs e realizações para enriquecer as respostas da IA.
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
