export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContentList } from '@/services/admin/contentService';
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
  Clock3,
} from 'lucide-react';

export default async function AIDashboardExecutivePage() {
  const content = await getContentList();
  const total = content.length;
  const drafts = content.filter((c) => c.status === 'draft').length;
  const published = content.filter((c) => c.status === 'published').length;
  const withImage = content.filter((c) => !!c.featuredImageUrl).length;
  const withAudio = content.filter((c) => !!c.audioBase64).length;
  const lastUpdated = content[0]?.updatedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(content[0].updatedAt),
      )
    : '—';

  const providerStatus = [
    {
      name: 'Gemini',
      ok: !!process.env.GEMINI_API_KEY,
      details: 'Texto e imagem',
    },
    {
      name: 'OpenAI',
      ok: !!process.env.OPENAI_API_KEY,
      details: 'Fallback texto/imagem',
    },
    {
      name: 'ElevenLabs',
      ok: !!process.env.ELEVENLABS_API_KEY,
      details: 'Voz/narração',
    },
  ];

  const recentContent = content.slice(0, 5);

  const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;
  const mediaAttachRate = total > 0 ? Math.round(((withImage + withAudio) / (total * 2)) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 px-3 md:px-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 px-6 py-6 md:px-10 md:py-10 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-100/80">Painel Executivo de IA</p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-sky-200" /> Uso e Saúde dos Modelos
            </h1>
            <p className="text-sm text-slate-100/90">
              Visão consolidada do engajamento gerado por IA: texto, arte e voz. Monitore chaves, outputs e rascunhos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" asChild>
              <Link href="/dashboard/admin/content/wizard">
                <Wand2 className="mr-2 h-4 w-4" /> Abrir Wizard (IA)
              </Link>
            </Button>
            <Button variant="default" asChild className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/dashboard/admin/content/create">
                <Bot className="mr-2 h-4 w-4" /> Criar Conteúdo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Conteúdos gerados"
          value={total}
          subtitle={`${drafts} rascunhos · ${published} publicados`}
          icon={Activity}
        />
        <StatCard
          title="Mídia anexa"
          value={`${withImage} artes · ${withAudio} áudios`}
          subtitle="Geração multimodal"
          icon={ImageIcon}
        />
        <StatCard
          title="Status geral"
          value={`${completionRate}%`}
          subtitle="Taxa de publicação"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Saúde dos provedores
              </CardTitle>
              <p className="text-sm text-muted-foreground">Verifique chaves e disponibilidade para texto/arte/voz.</p>
            </div>
            <span className="text-xs text-muted-foreground">Última atualização: {lastUpdated}</span>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {providerStatus.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  {p.ok ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs">
                      <CheckCircle2 className="h-4 w-4" /> OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertCircle className="h-4 w-4" /> Falta chave
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.details}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> Ações rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <QuickAction
              title="Gerar kit completo"
              description="Texto, arte e áudio prontos para WhatsApp/Instagram."
              href="/dashboard/admin/content/wizard"
            />
            <QuickAction
              title="Criar conteúdo manual + IA"
              description="Edite título, rascunho e peça sugestões sob demanda."
              href="/dashboard/admin/content/create"
            />
            <QuickAction
              title="Ver rascunhos"
              description="Revise e publique os materiais gerados."
              href="/dashboard/admin/content"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Saída recente
              </CardTitle>
              <p className="text-sm text-muted-foreground">Últimos conteúdos gerados/salvos.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/content">Abrir CMS</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {recentContent.length === 0 && (
              <div className="py-6 text-muted-foreground">Nenhum conteúdo gerado ainda.</div>
            )}
            {recentContent.map((c) => (
              <div key={c.id} className="flex flex-col gap-1 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{c.title || 'Sem título'}</span>
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">
                    {c.status || 'rascunho'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {c.updatedAt
                      ? new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(c.updatedAt))
                      : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    {c.featuredImageUrl ? 'Com arte' : 'Sem arte'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mic2 className="h-4 w-4" />
                    {c.audioBase64 ? 'Com áudio' : 'Sem áudio'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Indicadores rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressItem
              label="Publicação"
              value={completionRate}
              helper={`${published} de ${total || 0} publicados`}
            />
            <ProgressItem
              label="Mídia anexada (arte/áudio)"
              value={mediaAttachRate}
              helper={`${withImage} artes · ${withAudio} áudios`}
            />
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Próximos passos: ativar logs de chamada de provedor, limites e alertas de quota para chaves de IA.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
};

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{title}</span>
        <Wand2 className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

function ProgressItem({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
