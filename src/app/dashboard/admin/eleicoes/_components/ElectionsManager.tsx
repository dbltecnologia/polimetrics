'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, CalendarDays, Trash2, Library } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addElectionRecord, deleteElectionRecord } from '@/services/admin/elections/adminElectionActions';
import { ElectionRecord } from '@/services/admin/elections/electionsService';

export function ElectionsManager({ data }: { data: ElectionRecord[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

    const handleCreate = async (formData: FormData) => {
        setLoading(true);
        const res = await addElectionRecord(formData);
        setLoading(false);

        if (res.success) {
            toast({ title: 'Eleição registrada!' });
            setOpen(false);
        } else {
            toast({ title: 'Erro', description: res.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string, year: string) => {
        if (!confirm(`Deseja excluir o registro da Eleição ${year}?`)) return;
        setDeletingMap(prev => ({ ...prev, [id]: true }));
        const res = await deleteElectionRecord(id);
        setDeletingMap(prev => ({ ...prev, [id]: false }));
        if (res.success) {
            toast({ title: 'Registro excluído.' });
        } else {
            toast({ title: 'Erro', description: res.message, variant: 'destructive' });
        }
    };

    const sortedData = [...data].sort((a, b) => parseInt(b.year) - parseInt(a.year)); // decrescente

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Tabela de Pleitos</CardTitle>
                    <CardDescription>Gerencie os dados das eleições passadas.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Eleição</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Eleição</DialogTitle>
                            <DialogDescription>Insira o ano e a quantidade de votos obtidos.</DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ano da Eleição</label>
                                    <Input name="year" placeholder="Ex.: 2022" type="number" min="1980" max="2100" required disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Total de Votos</label>
                                    <Input name="totalVotes" placeholder="Ex.: 45000" type="number" min="0" required disabled={loading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Observações (Opcional)</label>
                                <Textarea name="notes" placeholder="Detalhes do pleito (votação majoritária ou proporcional...)" rows={3} disabled={loading} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar Registro
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-0">
                {sortedData.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50">
                        <Library className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">Nenhum registro eleitoral cadastrado.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {sortedData.map(record => (
                            <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 text-primary w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                                        <CalendarDays className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-slate-900">{record.year}</p>
                                        <p className="text-xs text-muted-foreground">{record.notes || 'Sem observações'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                    <div className="text-left sm:text-right">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total de Votos</p>
                                        <p className="font-bold text-lg text-emerald-600">{record.totalVotes.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                        onClick={() => handleDelete(record.id, record.year)}
                                        disabled={deletingMap[record.id]}
                                    >
                                        {deletingMap[record.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
