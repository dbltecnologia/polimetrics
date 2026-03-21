
// src/components/outreach-plans-client-view.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getOutreachPlans, updateOutreachPlanItem, deleteAllOutreachPlans, deleteOutreachPlansByStatus } from '@/lib/actions';
import { AlertTriangle, ArrowLeft, Loader2, MessageSquare, BookOpenCheck, Save, Search, Sparkles, Trash2, ChevronRight, CalendarDays } from 'lucide-react';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OutreachItem } from '@/types/ai-types';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";

type PlanData = {
    id: string;
    createdAt: { seconds: number; nanoseconds: number };
    planData: OutreachItem[];
};

type FlatLead = OutreachItem & {
    planId: string;
    planDate: Date;
    status: string;
    agentNotes: string;
};

const STATUS_OPTIONS = ['Pendente', 'Contatado', 'Concluído', 'Falhou'];
const STATUS_FILTER_OPTIONS = ['Todos', ...STATUS_OPTIONS];

const STATUS_STYLES: Record<string, string> = {
    Pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Contatado: 'bg-blue-100 text-blue-800 border-blue-200',
    'Concluído': 'bg-green-100 text-green-800 border-green-200',
    Falhou: 'bg-red-100 text-red-800 border-red-200',
};

const statusToDeleteOptions = [
    { value: 'all', label: 'Todos os Planos' },
    { value: 'Pendente', label: 'Apenas Pendentes' },
    { value: 'Contatado', label: 'Apenas Contatados' },
    { value: 'Concluído', label: 'Apenas Concluídos' },
    { value: 'Falhou', label: 'Apenas com Falha' },
];

export function OutreachPlansClientView() {
    const [plans, setPlans] = useState<PlanData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<string>('');
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedLead, setSelectedLead] = useState<FlatLead | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDraft, setModalDraft] = useState<{ status: string; agentNotes: string }>({ status: 'Pendente', agentNotes: '' });

    const router = useRouter();
    const { toast } = useToast();

    const fetchPlans = useCallback(async (id: string | null) => {
        if (!id) { setPlans([]); setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const { data: fetchedPlans } = await getOutreachPlans(id);
            setPlans(fetchedPlans);
        } catch {
            setPlans([]);
            toast({ title: 'Erro', description: 'Não foi possível buscar os planos.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const handleStorageChange = () => {
            const currentId = sessionStorage.getItem('activeUploadId');
            setUploadId(currentId);
            fetchPlans(currentId);
        };
        handleStorageChange();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchPlans]);

    // Flatten all leads from all plans into a single list
    const allLeads = useMemo<FlatLead[]>(() => {
        return plans.flatMap(plan =>
            (plan.planData || [])
                .filter(item => item && item.leadName && !['leadName', 'string', 'N/A'].includes(item.leadName))
                .map(item => ({
                    ...item,
                    planId: plan.id,
                    planDate: new Date(plan.createdAt.seconds * 1000),
                    status: (item as any).status || 'Pendente',
                    agentNotes: (item as any).agentNotes || '',
                }))
        );
    }, [plans]);

    const filteredLeads = useMemo(() => {
        return allLeads.filter(lead => {
            const statusMatch = statusFilter === 'Todos' || lead.status === statusFilter;
            const searchMatch = !searchFilter || lead.leadName.toLowerCase().includes(searchFilter.toLowerCase());
            return statusMatch && searchMatch;
        });
    }, [allLeads, statusFilter, searchFilter]);

    const openLeadModal = (lead: FlatLead) => {
        setSelectedLead(lead);
        setModalDraft({ status: lead.status, agentNotes: lead.agentNotes });
        setIsModalOpen(true);
    };

    const handleSaveModal = async () => {
        if (!uploadId || !selectedLead) return;
        setUpdatingItemId(selectedLead.leadId);
        try {
            const updatedItem = { ...selectedLead, status: modalDraft.status, agentNotes: modalDraft.agentNotes };
            await updateOutreachPlanItem(uploadId, selectedLead.planId, updatedItem as any);
            // Update local state
            setPlans(prev => prev.map(plan =>
                plan.id === selectedLead.planId
                    ? { ...plan, planData: plan.planData.map(i => i.leadId === selectedLead.leadId ? { ...i, status: modalDraft.status, agentNotes: modalDraft.agentNotes } as any : i) }
                    : plan
            ));
            toast({ title: 'Salvo!', description: `Status de "${selectedLead.leadName}" atualizado.` });
            setIsModalOpen(false);
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDeleteByStatus = async () => {
        if (!uploadId || !statusToDelete) {
            toast({ title: 'Selecione um alvo', variant: 'destructive' });
            return;
        }
        setIsDeleting(true);
        try {
            if (statusToDelete === 'all') {
                await deleteAllOutreachPlans(uploadId);
                toast({ title: 'Sucesso!', description: 'Todos os planos foram excluídos.' });
            } else {
                const result = await deleteOutreachPlansByStatus(uploadId, statusToDelete);
                toast({ title: 'Sucesso!', description: `${result.count} item(ns) excluídos.` });
            }
            fetchPlans(uploadId);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setStatusToDelete('');
        }
    };

    // Summary counts
    const counts = useMemo(() => {
        const c: Record<string, number> = { Pendente: 0, Contatado: 0, 'Concluído': 0, Falhou: 0 };
        allLeads.forEach(l => { if (c[l.status] !== undefined) c[l.status]++; });
        return c;
    }, [allLeads]);

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 shadow-inner">
                        <BookOpenCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">Planos de Abordagem Salvos</h1>
                        <p className="text-slate-400 mt-1">Revise e atualize os planos de ação gerados pela IA.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <NextLink href="/dashboard" passHref>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Criar Abordagens
                        </Button>
                    </NextLink>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isLoading || allLeads.length === 0} className="w-full sm:w-auto text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400 rounded-xl bg-transparent">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Planos...
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-100">Excluir Itens de Planos</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    Selecione quais itens deseja excluir. Os leads associados terão seu status revertido para "Novo".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-2">
                                <Label htmlFor="status-select" className="text-slate-300">Excluir itens com status:</Label>
                                <Select onValueChange={setStatusToDelete} value={statusToDelete}>
                                    <SelectTrigger id="status-select" className="bg-[#12121A]/80 border-white/10 text-slate-200 rounded-xl h-11">
                                        <SelectValue placeholder="Selecione um alvo para exclusão" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#12121A] border-white/10 text-slate-200">
                                        {statusToDeleteOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10 focus:text-white cursor-pointer">{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setStatusToDelete('')} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteByStatus}
                                    disabled={isDeleting || !statusToDelete}
                                    className="bg-red-600 hover:bg-red-500 text-white rounded-xl border-0 shadow-none"
                                >
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirmar Exclusão
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={() => router.back()} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>

            {/* No funnel state */}
            {!uploadId && !isLoading ? (
                <Card className="flex-1 flex flex-col justify-center items-center p-12 text-center bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl shadow-xl">
                    <div className="p-6 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-6">
                        <AlertTriangle className="w-16 h-16 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-slate-100">Nenhum Funil Ativo</h2>
                    <p className="text-slate-400 mb-8 max-w-md">Selecione um funil no menu superior para ver os planos salvos e contatos.</p>
                    <NextLink href="/" passHref>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 px-8">Ir para o Dashboard</Button>
                    </NextLink>
                </Card>
            ) : isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary chips */}
                    {allLeads.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(statusFilter === s ? 'Todos' : s)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${STATUS_STYLES[s]} ${statusFilter === s ? 'ring-2 ring-offset-1 ring-primary' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    {s}: {counts[s]}
                                </button>
                            ))}
                            {statusFilter !== 'Todos' && (
                                <button onClick={() => setStatusFilter('Todos')} className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-slate-400 hover:bg-white/5 transition-colors">
                                    Limpar filtro ×
                                </button>
                            )}
                        </div>
                    )}

                    {/* Search & status filter */}
                    <Card className="mb-4 bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl">
                        <CardContent className="flex flex-col md:flex-row gap-4 pt-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-[13px] h-5 w-5 text-slate-500" />
                                <Input
                                    placeholder="Pesquisar por nome do lead..."
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                    className="pl-10 h-12 bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl"
                                />
                            </div>
                            <div className="md:w-56">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-12 bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-xl">
                                        {STATUS_FILTER_OPTIONS.map(opt => (
                                            <SelectItem key={opt} value={opt} className="focus:bg-white/10 focus:text-white cursor-pointer">{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lead list */}
                    {filteredLeads.length === 0 ? (
                        <Card className="flex-1 flex flex-col justify-center items-center p-12 text-center bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl shadow-xl">
                            <div className="p-6 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-6">
                                <AlertTriangle className="w-16 h-16 text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-slate-100">
                                {allLeads.length === 0 ? 'Nenhum plano gerado' : 'Nenhum resultado encontrado'}
                            </h2>
                            <p className="text-slate-400 max-w-md">
                                {allLeads.length === 0
                                    ? 'Gere planos de abordagem pelo Dashboard para vê-los aqui.'
                                    : 'Nenhum lead corresponde aos filtros aplicados.'}
                            </p>
                            {allLeads.length === 0 && (
                                <NextLink href="/dashboard" passHref className="mt-8">
                                    <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 px-8"><Sparkles className="mr-2 h-4 w-4" />Criar Agora</Button>
                                </NextLink>
                            )}
                        </Card>
                    ) : (
                        <Card className="flex-1 overflow-hidden bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl shadow-xl">
                            <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg text-slate-100">Leads Planejados</CardTitle>
                                        <CardDescription className="text-slate-400">{filteredLeads.length} de {allLeads.length} contatos</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(100vh-380px)] min-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-[#0A0A12] z-10 border-b border-white/5">
                                            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                                                <th className="px-6 py-4 font-medium">Lead</th>
                                                <th className="px-6 py-4 font-medium hidden md:table-cell">Data do Plano</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredLeads.map((lead, idx) => (
                                                <tr
                                                    key={`${lead.planId}-${lead.leadId}`}
                                                    className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${idx % 2 === 0 ? '' : 'bg-[#1A1A24]/30'}`}
                                                    onClick={() => openLeadModal(lead)}
                                                >
                                                    <td className="px-6 py-4 font-medium text-slate-200">
                                                        <span className="line-clamp-1">{lead.leadName}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 hidden md:table-cell">
                                                        <span className="flex items-center gap-2">
                                                            <CalendarDays className="h-4 w-4 text-blue-400/70" />
                                                            {format(lead.planDate, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${STATUS_STYLES[lead.status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                                            {lead.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Lead detail modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                    <DialogHeader className="border-b border-white/5 pb-4">
                        <DialogTitle className="text-xl text-slate-100">{selectedLead?.leadName}</DialogTitle>
                        {selectedLead && (
                            <p className="text-sm text-slate-400 mt-1">
                                Plano de {format(selectedLead.planDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                        )}
                    </DialogHeader>

                    {selectedLead && (
                        <div className="space-y-6 py-4">
                            {/* Suggested message */}
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                    <MessageSquare className="h-4 w-4" /> Mensagem Sugerida
                                </p>
                                <p className="text-[15px] leading-relaxed text-slate-300">{selectedLead.suggestedMessage}</p>
                            </div>

                            {/* Status */}
                            <div className="grid gap-2">
                                <Label htmlFor="modal-status" className="text-slate-300">Status</Label>
                                <Select value={modalDraft.status} onValueChange={v => setModalDraft(d => ({ ...d, status: v }))}>
                                    <SelectTrigger id="modal-status" className="bg-[#12121A]/80 border-white/10 text-slate-200 h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-xl">
                                        {STATUS_OPTIONS.map(s => (
                                            <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white cursor-pointer">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="grid gap-2">
                                <Label htmlFor="modal-notes" className="text-slate-300">Observações do Agente</Label>
                                <Textarea
                                    id="modal-notes"
                                    placeholder="Adicione uma nota sobre a interação..."
                                    value={modalDraft.agentNotes}
                                    onChange={e => setModalDraft(d => ({ ...d, agentNotes: e.target.value }))}
                                    className="min-h-[120px] bg-[#12121A]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl resize-none"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-4 border-t border-white/5">
                        <DialogClose asChild>
                            <Button variant="ghost" className="bg-transparent text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Fechar</Button>
                        </DialogClose>
                        <Button onClick={handleSaveModal} disabled={updatingItemId === selectedLead?.leadId} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0 h-10 px-6">
                            {updatingItemId === selectedLead?.leadId ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
