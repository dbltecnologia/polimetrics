'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Vote, CheckCircle2, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Poll } from '@/services/pollsService';

export function PollsTab({ polls, userId }: { polls: Poll[], userId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [selectionMap, setSelectionMap] = useState<Record<string, string>>({});

    const handleVote = async (poll: Poll) => {
        const optionId = selectionMap[poll.id];
        if (!optionId) {
            toast({ title: 'Selecione uma opção antes de votar.', variant: 'destructive' });
            return;
        }
        setLoadingMap(prev => ({ ...prev, [poll.id]: true }));
        try {
            const res = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId: poll.id, optionId }),
            });
            if (!res.ok) {
                throw new Error('Falha ao computar o voto.');
            }
            toast({ title: 'Voto computado com sucesso!' });
            router.refresh();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setLoadingMap(prev => ({ ...prev, [poll.id]: false }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Minivotações</h2>
                    <p className="text-sm text-muted-foreground">Participe das decisões estratégicas do mandato.</p>
                </div>
            </div>

            {polls.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center bg-slate-50">
                    <Vote className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma votação ativa no momento.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {polls.map(poll => {
                        const userVotedId = poll.votedBy?.[userId];
                        const totalVotes = Object.keys(poll.votedBy || {}).length;

                        return (
                            <Card key={poll.id} className="flex flex-col h-full bg-white shadow-sm border-slate-200">
                                <CardHeader className="pb-3 border-b flex-none bg-slate-50/50 rounded-t-xl">
                                    <CardTitle className="text-base leading-snug">{poll.title}</CardTitle>
                                    {poll.description && <CardDescription className="mt-1">{poll.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="pt-5 flex-1 p-5">
                                    {userVotedId ? (
                                        <div className="space-y-4">
                                            <div className="bg-emerald-50 text-emerald-800 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2 border border-emerald-100">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                Você já participou desta votação.
                                            </div>
                                            <div className="space-y-4 mt-5">
                                                {poll.options.map((opt) => {
                                                    const optVotes = Object.values(poll.votedBy || {}).filter(v => v === opt.id).length;
                                                    const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                                    const isSelected = userVotedId === opt.id;
                                                    return (
                                                        <div key={opt.id} className="space-y-1 block">
                                                            <div className="flex justify-between text-sm text-slate-800 font-medium mb-1">
                                                                <span className={isSelected ? 'text-emerald-700 font-bold' : ''}>
                                                                    {opt.text} {isSelected && <span className="text-emerald-600">(Seu Voto)</span>}
                                                                </span>
                                                                <span>{percentage}%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{optVotes} voto{optVotes !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <RadioGroup
                                            value={selectionMap[poll.id] || ''}
                                            onValueChange={(val) => setSelectionMap(prev => ({ ...prev, [poll.id]: val }))}
                                            className="flex flex-col gap-3"
                                        >
                                            {poll.options.map(opt => (
                                                <div key={opt.id} className="flex flex-row items-center border rounded-lg transition-colors cursor-pointer hover:border-primary/50 relative overflow-hidden group">
                                                    <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} className="absolute left-4 top-1/2 -translate-y-1/2" />
                                                    <Label htmlFor={`opt-${opt.id}`} className="flex-1 cursor-pointer font-medium p-4 pl-12 h-full text-slate-800 group-hover:text-primary">
                                                        {opt.text}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                </CardContent>
                                {!userVotedId && (
                                    <CardFooter className="pt-0 border-t mt-auto flex justify-between items-center py-4 bg-slate-50/50 rounded-b-xl border-slate-100">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                            <BarChart2 className="w-4 h-4" />
                                            {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} no total
                                        </span>
                                        <Button
                                            onClick={() => handleVote(poll)}
                                            disabled={loadingMap[poll.id] || !selectionMap[poll.id]}
                                            size="sm"
                                            className="px-6"
                                        >
                                            {loadingMap[poll.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Vote className="w-4 h-4 mr-2" />}
                                            Confirmar Voto
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
