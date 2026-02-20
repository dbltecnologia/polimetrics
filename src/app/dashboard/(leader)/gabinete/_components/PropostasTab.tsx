'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, MessageSquare, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Chamado } from '@/types/chamado';

export function PropostasTab({ chamados }: { chamados: Chamado[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast({ title: 'Preencha assunto e mensagem.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/chamados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message }),
            });
            if (!res.ok) {
                throw new Error('Falha ao enviar proposta.');
            }
            toast({ title: 'Proposta enviada com sucesso!' });
            setSubject('');
            setMessage('');
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Minhas Propostas</h2>
                    <p className="text-sm text-muted-foreground">Acompanhe o status das suas sugestões.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Nova Proposta</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enviar Proposta</DialogTitle>
                            <DialogDescription>Descreva sua demanda ou sugestão para o candidato.</DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assunto</label>
                                <Input
                                    placeholder="Ex.: Melhoria na iluminação da praça"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descrição</label>
                                <Textarea
                                    placeholder="Detalhe sua proposta com argumentos e necessidades."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Enviar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {chamados.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center bg-slate-50">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma proposta enviada ainda.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {chamados.map(c => (
                        <Card key={c.id}>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">{c.subject}</CardTitle>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                                    </div>
                                </div>
                                {c.status === 'aberto' ? (
                                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">Em Análise</span>
                                ) : (
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Concluído
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
