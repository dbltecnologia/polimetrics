'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarClock, MessageSquare, User } from 'lucide-react';
import { ChamadoActions } from './ChamadoActions';

interface Chamado {
    id: string;
    subject?: string;
    name?: string;
    message?: string;
    status?: string;
    createdAt?: any;
}

const formatDate = (value: any) => {
    if (!value) return '';
    const date = (value as any).toDate ? (value as any).toDate() : new Date(value);
    return isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const statusConfig: Record<string, { label: string; className: string }> = {
    aberto: { label: 'Aberto', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    respondido: { label: 'Respondido', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    fechado: { label: 'Fechado', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

export function ChamadosList({ chamados }: { chamados: Chamado[] }) {
    const [selected, setSelected] = useState<Chamado | null>(null);

    return (
        <>
            {/* Mobile */}
            <div className="space-y-3 md:hidden">
                {chamados.length === 0 && (
                    <Card>
                        <CardContent className="p-4 text-sm text-muted-foreground">
                            Nenhum chamado registrado.
                        </CardContent>
                    </Card>
                )}
                {chamados.map((c) => (
                    <div
                        key={c.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => setSelected(c)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-base font-semibold text-slate-900">{c.subject || 'Sem assunto'}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>{c.name || 'Remetente não informado'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarClock className="h-4 w-4 text-primary" />
                                    <span>{formatDate(c.createdAt) || 'Sem data'}</span>
                                </div>
                            </div>
                            <div className="-mt-1 -mr-1" onClick={(e) => e.stopPropagation()}>
                                <ChamadoActions id={c.id} currentStatus={c.status} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
                <Card>
                    <CardHeader>
                        <CardTitle>Chamados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chamados.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum chamado registrado.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Assunto</TableHead>
                                        <TableHead>Remetente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right w-[80px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chamados.map((c) => {
                                        const sc = statusConfig[c.status || 'aberto'] || statusConfig.aberto;
                                        return (
                                            <TableRow
                                                key={c.id}
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() => setSelected(c)}
                                            >
                                                <TableCell className="font-semibold">{c.subject || 'Sem assunto'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{c.name || '—'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt) || '—'}</TableCell>
                                                <TableCell>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc.className}`}>{sc.label}</span>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <ChamadoActions id={c.id} currentStatus={c.status} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>{selected?.subject || 'Sem assunto'}</SheetTitle>
                        <SheetDescription>
                            <span className="flex flex-col gap-1 mt-1">
                                <span className="flex items-center gap-1 text-sm"><User className="h-4 w-4" /> {selected?.name || 'Remetente não informado'}</span>
                                <span className="flex items-center gap-1 text-sm"><CalendarClock className="h-4 w-4" /> {formatDate(selected?.createdAt) || 'Data não informada'}</span>
                            </span>
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Mensagem</p>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border">
                                {selected?.message || 'Sem mensagem.'}
                            </p>
                        </div>
                        {selected && (
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                <ChamadoActions id={selected.id} currentStatus={selected.status} />
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
