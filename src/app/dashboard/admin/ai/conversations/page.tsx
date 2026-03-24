'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Clock, RefreshCw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Conversation {
    id: string;
    step?: string;
    history?: { role: string; content: string }[];
    updatedAt?: string;
    activePollId?: string;
}

const STEP_LABELS: Record<string, { label: string; color: string }> = {
    start: { label: 'Início', color: 'bg-slate-100 text-slate-700' },
    asking_bairro: { label: 'Qualificando — Bairro', color: 'bg-amber-100 text-amber-700' },
    asking_area: { label: 'Qualificando — Área', color: 'bg-amber-100 text-amber-700' },
    main: { label: 'Fluxo Principal', color: 'bg-emerald-100 text-emerald-700' },
    waiting_poll_vote: { label: 'Aguardando Voto', color: 'bg-blue-100 text-blue-700' },
};

function formatDate(value: string | undefined) {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export default function ConversacoesIAPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai/conversations');
            const data = await res.json();
            setConversations(data.conversations || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Conversas do Secretário Virtual</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitoramento em tempo real das conversas ativas via WhatsApp (Z-API).
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/dashboard/admin/ai/knowledge">
                            <Bot className="h-4 w-4 mr-2" />
                            Base de Conhecimento
                        </Link>
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12 text-muted-foreground text-sm">Carregando conversas...</div>
            )}

            {!loading && conversations.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Nenhuma conversa registrada ainda.</p>
                        <p className="text-xs mt-1">As conversas aparecerão aqui quando o secretário virtual receber mensagens via WhatsApp.</p>
                    </CardContent>
                </Card>
            )}

            {!loading && conversations.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {conversations.map((conv) => {
                        const stepInfo = STEP_LABELS[conv.step || 'start'] || STEP_LABELS.start;
                        const lastMsg = conv.history?.slice(-1)[0];
                        // The conversation ID is the phone number (from Z-API) or Chatwoot conversation ID
                        const isPhone = /^\d{10,15}$/.test(conv.id);

                        return (
                            <Card key={conv.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate text-slate-900">
                                                    {isPhone
                                                        ? `+${conv.id.replace(/^55/, '+55 ')}`
                                                        : `Conversa #${conv.id}`}
                                                </p>
                                                {isPhone && (
                                                    <p className="text-[10px] text-muted-foreground">via WhatsApp · Z-API</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${stepInfo.color}`}>
                                            {stepInfo.label}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {lastMsg && (
                                        <div className="rounded-lg bg-slate-50 border p-2">
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                                                Última mensagem ({lastMsg.role === 'user' ? 'Usuário' : 'Bot'})
                                            </p>
                                            <p className="text-xs text-slate-700 line-clamp-2">{lastMsg.content}</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(conv.updatedAt)}</span>
                                    </div>
                                    {conv.activePollId && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            🗳️ Votação ativa: {conv.activePollId.slice(0, 8)}...
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
