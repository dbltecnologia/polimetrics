'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Vote, CalendarDays, BarChart2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createPoll, closePoll } from '@/services/admin/polls/adminPollActions';
import { Poll } from '@/services/pollsService';
import { useRouter } from 'next/navigation';

export function AdminPollsList({ initialPolls }: { initialPolls: Poll[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [closingMap, setClosingMap] = useState<Record<string, boolean>>({});

    const handleCreate = async (formData: FormData) => {
        setLoading(true);
        const res = await createPoll(formData);
        setLoading(false);

        if (res.success) {
            toast({ title: 'Votação criada com sucesso!' });
            setOpen(false);
        } else {
            toast({ title: 'Erro', description: res.message, variant: 'destructive' });
        }
    };

    const handleClose = async (pollId: string) => {
        if (!confirm('Deseja realmente encerrar esta votação?')) return;
        setClosingMap(prev => ({ ...prev, [pollId]: true }));
        const res = await closePoll(pollId);
        setClosingMap(prev => ({ ...prev, [pollId]: false }));
        if (res.success) {
            toast({ title: 'Votação encerrada.' });
        } else {
            toast({ title: 'Erro', description: 'Não foi possível encerrar a votação.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Gerenciar Minivotações</h2>
                    <p className="text-sm text-muted-foreground">Crie e acompanhe enquetes para a sua base de líderes.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Nova Votação</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Minivotação</DialogTitle>
                            <DialogDescription>A votação ficará disponível imediatamente no Gabinete Virtual dos líderes.</DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título da Votação</label>
                                <Input name="title" placeholder="Ex.: Escolha o local do próximo encontro" required disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descrição (Opcional)</label>
                                <Textarea name="description" placeholder="Detalhes para ajudar na escolha..." rows={3} disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Opções (uma por linha)</label>
                                <Textarea name="options" placeholder="Opção A&#10;Opção B&#10;Opção C" rows={4} required disabled={loading} />
                                <p className="text-xs text-muted-foreground">Pressione Enter para separar as opções.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Publicar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {initialPolls.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center bg-white">
                    <Vote className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">Nenhuma votação cadastrada.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {initialPolls.map(poll => {
                        const totalVotes = Object.keys(poll.votedBy || {}).length;

                        return (
                            <Card key={poll.id} className={`flex flex-col h-full ${poll.status === 'closed' ? 'bg-slate-50 opacity-90' : 'bg-white'}`}>
                                <CardHeader className="pb-3 border-b border-slate-100 flex-none">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base leading-snug">{poll.title}</CardTitle>
                                        {poll.status === 'active' ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">Ativa</span>
                                        ) : (
                                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">Encerrada</span>
                                        )}
                                    </div>
                                    {poll.description && <CardDescription className="mt-2 text-xs">{poll.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="pt-4 flex-1">
                                    <div className="space-y-3">
                                        {poll.options.map((opt) => {
                                            const optVotes = Object.values(poll.votedBy || {}).filter(v => v === opt.id).length;
                                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt.id} className="space-y-1 block">
                                                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                                                        <span>{opt.text}</span>
                                                        <span>{percentage}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${poll.status === 'active' ? 'bg-primary' : 'bg-slate-400'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{optVotes} voto{optVotes !== 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t border-slate-100 mt-auto flex justify-between items-center bg-slate-50/50 rounded-b-xl">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        {totalVotes} Votos Totais
                                    </span>
                                    {poll.status === 'active' && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleClose(poll.id)}
                                            disabled={closingMap[poll.id]}
                                        >
                                            {closingMap[poll.id] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                            Encerrar
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
