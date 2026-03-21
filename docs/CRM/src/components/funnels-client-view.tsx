// src/components/funnels-client-view.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFunnels, createFunnel, renameFunnel, deleteFunnel, revertLeadsWithoutPlan, getApiKeys, setFunnelMessagingInstance, setFunnelFallbackInstance, getMessagingInstances, getInstanceConnectionState, duplicateFunnel, getCampaignHealthStats, type ApiKey, type MessagingInstance } from '@/lib/actions';
import type { ProviderType } from '@/lib/messaging';
import { PROVIDER_LABELS } from '@/lib/messaging/types';
import { Loader2, PlusCircle, Check, ArrowLeft, Settings, Edit, Save, X, Trash2, Copy, Wand2, KeyRound, Server, CopyPlus, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { useRouter, usePathname } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
    DialogClose
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ActivityLogPanel } from './activity-log-panel';

function FunnelInstanceModal({ funnelId, funnelName, currentInstanceName, onInstanceSet }: { funnelId: string, funnelName: string, currentInstanceName?: string | null, onInstanceSet: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [instances, setInstances] = useState<MessagingInstance[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string | undefined>(currentInstanceName || undefined);
    const [selectedFallback, setSelectedFallback] = useState<string | undefined>(undefined);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user?.uid) {
            setIsFetching(true);
            getMessagingInstances(user.uid)
                .then(async (fetchedInstances) => {
                    // Feature 3: Enrich with connection status
                    const enriched = await Promise.all(
                        fetchedInstances.map(async (inst) => {
                            try {
                                const result = await getInstanceConnectionState(
                                    inst.name,
                                    inst.provider || 'evolution',
                                    inst.config
                                );
                                const state = result.data?.instance?.state || result.data?.state || 'unknown';
                                return { ...inst, status: state };
                            } catch {
                                return { ...inst, status: 'unknown' };
                            }
                        })
                    );
                    setInstances(enriched);
                })
                .catch((err: any) => {
                    toast({ title: "Erro ao buscar instâncias", description: err.message, variant: 'destructive' });
                })
                .finally(() => setIsFetching(false));
        }
    }, [isOpen, user?.uid, toast]);

    useEffect(() => {
        setSelectedInstance(currentInstanceName || undefined);
    }, [currentInstanceName]);

    const handleSave = async () => {
        if (!selectedInstance) {
            toast({ title: "Nenhuma instância selecionada", variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            // Find the selected instance to get its provider type
            const inst = instances.find(i => i.name === selectedInstance);
            const provider: ProviderType = inst?.provider || 'evolution';
            await setFunnelMessagingInstance(funnelId, selectedInstance, provider);

            // Feature 6: Save fallback instance
            if (selectedFallback && selectedFallback !== 'none') {
                const fbInst = instances.find(i => i.name === selectedFallback);
                const fbProvider: ProviderType = fbInst?.provider || 'evolution';
                await setFunnelFallbackInstance(funnelId, selectedFallback, fbProvider);
            } else {
                await setFunnelFallbackInstance(funnelId, null, null);
            }

            toast({ title: "Sucesso!", description: `Instância (${PROVIDER_LABELS[provider]}) associada a este funil.` });
            onInstanceSet();
            setIsOpen(false);
        } catch (err: any) {
            toast({ title: "Erro ao salvar", description: err.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className='h-8 w-8' title="Configurar Instância de Mensageria">
                    <Server className='h-4 w-4 text-blue-500' />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-100">Configurar Instância de Mensageria</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Associe uma instância a este funil ({funnelName}) para automatizar as campanhas de disparo.
                    </DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                    <Label htmlFor='instance-select' className="text-slate-300">Instância</Label>
                    {isFetching ? (
                        <div className='flex items-center justify-center h-10'>
                            <Loader2 className='h-5 w-5 animate-spin text-blue-500' />
                        </div>
                    ) : (
                        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                            <SelectTrigger id='instance-select' className="bg-[#12121A]/80 border-white/10 text-slate-200 rounded-xl h-11 mt-1.5">
                                <SelectValue placeholder="Selecione uma instância..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                {instances.length > 0 ? (
                                    instances.map(instance => {
                                        const isConnected = instance.status === 'open' || instance.status === 'connected';
                                        const statusIcon = isConnected ? '✅' : instance.status === 'unknown' ? '⚪' : '❌';
                                        return (
                                            <SelectItem key={instance.id} value={instance.name} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">
                                                <span className='flex items-center gap-1.5'>
                                                    <span>{statusIcon}</span>
                                                    <span>{instance.name}</span>
                                                    <span className='text-slate-500'>({PROVIDER_LABELS[instance.provider || 'evolution']})</span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <div className='p-4 text-center text-sm text-slate-500'>Nenhuma instância encontrada. Crie uma em Configurações &gt; Instâncias.</div>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Feature 6: Fallback instance */}
                <div className='pt-2'>
                    <Label htmlFor='fallback-select' className='text-sm text-slate-400'>Instância de Fallback (opcional)</Label>
                    <p className='text-xs text-slate-500 mb-1.5'>Se o envio pela instância principal falhar, tenta automaticamente por esta.</p>
                    {isFetching ? null : (
                        <Select value={selectedFallback} onValueChange={setSelectedFallback}>
                            <SelectTrigger id='fallback-select' className="bg-[#12121A]/80 border-white/10 text-slate-200 rounded-xl h-11">
                                <SelectValue placeholder="Nenhum fallback" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                <SelectItem value="none" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Nenhum (sem fallback)</SelectItem>
                                {instances
                                    .filter(i => i.name !== selectedInstance)
                                    .map(instance => {
                                        const isConnected = instance.status === 'open' || instance.status === 'connected';
                                        const statusIcon = isConnected ? '✅' : '⚪';
                                        return (
                                            <SelectItem key={instance.id} value={instance.name} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">
                                                <span className='flex items-center gap-1.5'>
                                                    <span>{statusIcon}</span>
                                                    <span>{instance.name}</span>
                                                    <span className='text-slate-500'>({PROVIDER_LABELS[instance.provider || 'evolution']})</span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving || isFetching || !selectedInstance} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function FunnelsClientView() {
    const [funnels, setFunnels] = useState<{ id: string; name: string; evolutionInstanceName?: string | null; messagingInstanceName?: string | null; fallbackInstanceName?: string | null; }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
    const [deletionProgress, setDeletionProgress] = useState(0);
    const [isCorrecting, setIsCorrecting] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
    const [newFunnelName, setNewFunnelName] = useState('');
    const [editingFunnel, setEditingFunnel] = useState<{ id: string; name: string } | null>(null);
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedFunnels, setSelectedFunnels] = useState<Set<string>>(new Set());


    useEffect(() => {
        // Client-side only check
        const id = sessionStorage.getItem('activeUploadId');
        setActiveFunnelId(id);
    }, []);

    const refreshFunnels = useCallback(async () => {
        if (user) {
            setIsLoading(true);
            try {
                const userFunnelsResult = await getFunnels(user.uid);
                setFunnels(userFunnelsResult.data as any);
                // Notify the root layout to refresh the sidebar funnel list
                window.dispatchEvent(new Event('funnels-updated'));
            } catch (error) {
                toast({ title: "Erro", description: "Não foi possível carregar a lista de funis.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
    }, [user, toast]);

    useEffect(() => {
        if (user && !isAuthLoading) {
            refreshFunnels();
        }
    }, [user, isAuthLoading, refreshFunnels]);

    const handleFunnelSelect = (funnel: { id: string, name: string }) => {
        sessionStorage.setItem('activeUploadId', funnel.id);
        sessionStorage.setItem('activeFunnelName', funnel.name);
        toast({ title: 'Funil Alterado', description: `Funil "${funnel.name}" agora está ativo.` });

        if (pathname.startsWith('/dashboard') || pathname.startsWith('/kanban') || pathname.startsWith('/import') || pathname.startsWith('/analytics')) {
            window.location.reload();
        } else {
            router.push('/dashboard');
        }
    };

    const handleCreateFunnel = async () => {
        if (!newFunnelName.trim()) {
            toast({ title: 'Erro', description: 'O nome do funil não pode ser vazio.', variant: 'destructive' });
            return;
        }
        if (!user?.uid || !user?.email) {
            toast({ title: 'Erro', description: 'Informações do usuário não encontradas.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            const newFunnel = await createFunnel(newFunnelName, user.uid, user.email);
            toast({ title: 'Sucesso!', description: `Funil "${newFunnel.name}" criado.` });
            setNewFunnelName('');
            setIsCreateDialogOpen(false);
            await refreshFunnels();
            handleFunnelSelect(newFunnel);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao criar funil', description: 'Não foi possível criar o novo funil.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRenameFunnel = async () => {
        if (!editingFunnel || !editingFunnel.name.trim()) {
            toast({ title: 'Erro', description: 'O nome do funil não pode ser vazio.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            await renameFunnel(editingFunnel.id, editingFunnel.name);
            toast({ title: 'Sucesso!', description: 'Funil renomeado.' });

            if (activeFunnelId === editingFunnel.id) {
                sessionStorage.setItem('activeFunnelName', editingFunnel.name);
            }

            setEditingFunnel(null);
            await refreshFunnels();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao renomear', description: 'Não foi possível atualizar o nome do funil.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteFunnel = async (funnelId: string) => {
        setIsProcessing(true);
        try {
            await deleteFunnel(funnelId);
            toast({ title: 'Sucesso!', description: 'O funil e todos os seus dados foram excluídos.' });
            if (activeFunnelId === funnelId) {
                sessionStorage.removeItem('activeUploadId');
                sessionStorage.removeItem('activeFunnelName');
                setActiveFunnelId(null);
                window.dispatchEvent(new Event('storage'));
            }
            await refreshFunnels();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir o funil.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteMultipleFunnels = async () => {
        setIsDeletingMultiple(true);
        setDeletionProgress(0);

        const funnelsToDelete = Array.from(selectedFunnels);
        const totalToDelete = funnelsToDelete.length;

        for (let i = 0; i < totalToDelete; i++) {
            const funnelId = funnelsToDelete[i];
            try {
                await deleteFunnel(funnelId);
                if (activeFunnelId === funnelId) {
                    sessionStorage.removeItem('activeUploadId');
                    sessionStorage.removeItem('activeFunnelName');
                    setActiveFunnelId(null);
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (error) {
                toast({ title: 'Erro ao excluir funil', description: `Não foi possível excluir o funil ${funnelId}.`, variant: 'destructive' });
            }
            setDeletionProgress(((i + 1) / totalToDelete) * 100);
        }

        toast({ title: 'Exclusão em Lote Concluída', description: `${totalToDelete} funis foram excluídos.` });
        setSelectedFunnels(new Set());
        setIsDeletingMultiple(false);
        await refreshFunnels();
    };


    const handleCorrection = async (funnelId: string) => {
        setIsCorrecting(funnelId);
        try {
            const result = await revertLeadsWithoutPlan(funnelId);
            if (result.count > 0) {
                toast({ title: "Correção Concluída", description: `${result.count} lead(s) foram revertidos para o status "Novo".` });
            } else {
                toast({ title: "Nenhuma Correção Necessária", description: "Nenhum lead encontrado com status incorreto." });
            }
        } catch (error: any) {
            toast({ title: "Erro na Correção", description: error.message, variant: "destructive" });
        } finally {
            setIsCorrecting(null);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "ID do Funil Copiado!", description: "O ID foi copiado para a área de transferência." });
    }

    // Feature 8: Duplicate funnel
    const handleDuplicateFunnel = async (funnelId: string) => {
        setIsDuplicating(funnelId);
        try {
            const result = await duplicateFunnel(funnelId);
            toast({ title: 'Funil Duplicado!', description: `O funil "${result.name}" foi criado com sucesso.` });
            await refreshFunnels();
        } catch (error: any) {
            toast({ title: 'Erro ao duplicar', description: error.message, variant: 'destructive' });
        } finally {
            setIsDuplicating(null);
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFunnels(new Set(funnels.map(f => f.id)));
        } else {
            setSelectedFunnels(new Set());
        }
    }

    const handleSelectFunnel = (funnelId: string, checked: boolean) => {
        const newSelection = new Set(selectedFunnels);
        if (checked) {
            newSelection.add(funnelId);
        } else {
            newSelection.delete(funnelId);
        }
        setSelectedFunnels(newSelection);
    }

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-600/10 rounded-xl border border-violet-500/20 shadow-inner">
                        <Settings className="w-8 h-8 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">Gerenciar Funis</h1>
                        <p className="text-slate-400 mt-1">Crie, renomeie ou carregue um funil existente.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl h-11 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Criar Novo Funil
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl text-slate-100">Criar Novo Funil</DialogTitle>
                                <DialogDescription className="text-slate-400">Crie um funil de vendas vazio para começar a adicionar oportunidades manualmente.</DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2 py-4">
                                <Input
                                    placeholder="Nome do novo funil..."
                                    value={newFunnelName}
                                    onChange={(e) => setNewFunnelName(e.target.value)}
                                    disabled={isProcessing}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFunnel()}
                                    className="bg-[#12121A]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl h-12"
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="ghost" className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</Button></DialogClose>
                                <Button onClick={handleCreateFunnel} disabled={isProcessing || !newFunnelName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={() => router.back()} className="flex-1 sm:flex-none bg-[#0A0A12]/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>

            <Card className="flex-grow flex flex-col bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 bg-white/5 pb-6 gap-4">
                    <div>
                        <CardTitle className="text-xl text-slate-100">Funis Existentes</CardTitle>
                        <CardDescription className="text-slate-400 mt-1.5">Selecione os funis que deseja excluir ou clique em um para carregá-lo.</CardDescription>
                    </div>
                    {selectedFunnels.size > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white rounded-xl">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir {selectedFunnels.size} Funil(s)
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#0A0A12] border-white/10 text-slate-200">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-slate-100">Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        Esta ação excluirá permanentemente {selectedFunnels.size} funil(s) e todos os seus dados. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                    {isDeletingMultiple && (
                                        <div className="pt-4">
                                            <Progress value={deletionProgress} className="h-2 bg-white/10" />
                                            <p className='text-center text-sm text-slate-400 mt-2'>Excluindo funis... {Math.round(deletionProgress)}%</p>
                                        </div>
                                    )}
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeletingMultiple} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteMultipleFunnels} disabled={isDeletingMultiple} className="bg-red-600 hover:bg-red-500 text-white rounded-xl">
                                        {isDeletingMultiple ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Confirmar Exclusão
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading && !editingFunnel ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px] rounded-xl border border-white/10 bg-[#0A0A12]/50">
                            <div className="p-2 space-y-1">
                                <div className="flex items-center p-3 font-medium text-sm border-b border-white/5 text-slate-400">
                                    <Checkbox
                                        className="mr-3 border-white/20 data-[state=checked]:bg-blue-600"
                                        checked={selectedFunnels.size > 0 && selectedFunnels.size === funnels.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Selecionar todos"
                                    />
                                    <span className="flex-grow">Nome do Funil</span>
                                    <span className="pr-6">Ações</span>
                                </div>
                                {funnels.length > 0 ? (
                                    funnels.map((funnel) => (
                                        <div key={funnel.id} className="group/item flex items-center justify-between gap-2 p-3 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center flex-grow text-left truncate" >
                                                <Checkbox
                                                    className="mr-3 border-white/20 data-[state=checked]:bg-blue-600"
                                                    checked={selectedFunnels.has(funnel.id)}
                                                    onCheckedChange={(checked) => handleSelectFunnel(funnel.id, !!checked)}
                                                    aria-label={`Selecionar ${funnel.name}`}
                                                />
                                                {editingFunnel?.id === funnel.id ? (
                                                    <div className="flex-grow flex items-center gap-2 pr-4">
                                                        <Input
                                                            value={editingFunnel.name}
                                                            onChange={(e) => setEditingFunnel({ ...editingFunnel, name: e.target.value })}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleRenameFunnel()}
                                                            className="h-10 bg-[#12121A] border-blue-500/50 text-slate-100"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" className="h-10 w-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg" onClick={handleRenameFunnel} disabled={isProcessing}>
                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg" onClick={() => setEditingFunnel(null)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-grow cursor-pointer group-hover/item:pl-1 transition-all" onClick={() => handleFunnelSelect(funnel)}>
                                                        <p className="text-sm font-semibold text-slate-200 group-hover/item:text-blue-400 transition-colors">{funnel.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono flex-wrap">
                                                            <span>ID: {funnel.id}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(funnel.id) }} className="opacity-0 group-hover/item:opacity-100 hover:text-white transition-opacity"><Copy className="h-3 w-3" /></button>
                                                            {(funnel.messagingInstanceName || funnel.evolutionInstanceName) && (
                                                                <span className="flex items-center gap-1 font-sans text-blue-400 font-medium ml-1 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                                                    <Server className="h-3 w-3" />
                                                                    {funnel.messagingInstanceName || funnel.evolutionInstanceName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {!editingFunnel || editingFunnel.id !== funnel.id ? (
                                                <div className='flex items-center gap-1.5 opacity-60 group-hover/item:opacity-100 transition-opacity'>
                                                    <FunnelInstanceModal
                                                        funnelId={funnel.id}
                                                        funnelName={funnel.name}
                                                        currentInstanceName={funnel.messagingInstanceName || funnel.evolutionInstanceName}
                                                        onInstanceSet={refreshFunnels}
                                                    />
                                                    <ActivityLogPanel
                                                        funnelId={funnel.id}
                                                        funnelName={funnel.name}
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-[#0A0A12] border-white/10 text-slate-200">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-slate-100">Você tem certeza?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400">
                                                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o funil "{funnel.name}" e todos os seus leads.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteFunnel(funnel.id)}
                                                                    disabled={isProcessing}
                                                                    className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
                                                                >
                                                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button variant="ghost" size="icon" className='h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg' onClick={() => setEditingFunnel({ id: funnel.id, name: funnel.name })}>
                                                        <Edit className='h-4 w-4' />
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-9 bg-transparent border-white/10 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg" onClick={() => handleCorrection(funnel.id)} disabled={isCorrecting === funnel.id}>
                                                        {isCorrecting === funnel.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Wand2 className='h-4 w-4' />}
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-9 bg-transparent border-white/10 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg" onClick={() => handleDuplicateFunnel(funnel.id)} disabled={isDuplicating === funnel.id} title="Duplicar Funil">
                                                        {isDuplicating === funnel.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <CopyPlus className='h-4 w-4' />}
                                                    </Button>
                                                    <div className="ml-2 pl-2 border-l border-white/10">
                                                        {activeFunnelId === funnel.id ? (
                                                            <Button variant="ghost" size="sm" disabled className="h-9 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Ativo
                                                            </Button>
                                                        ) : (
                                                            <Button variant="outline" size="sm" className="h-9 bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 rounded-lg" onClick={() => handleFunnelSelect(funnel)}>
                                                                Carregar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Wand2 className="h-8 w-8 text-slate-500" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-300">Nenhum funil encontrado</p>
                                        <p className="text-slate-500 text-sm mt-1">Crie um novo funil para começar a organizar seus leads.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
