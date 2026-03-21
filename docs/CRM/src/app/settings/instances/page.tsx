// src/app/settings/instances/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createMessagingInstance, getMessagingInstances, deleteMessagingInstance, getInstanceConnectionState, testProviderConnection, updateMessagingInstance, getChatwootSsoUrl, type MessagingInstance } from '@/lib/actions';
import type { ProviderType } from '@/lib/messaging';
import { PROVIDER_LABELS, PROVIDER_DESCRIPTIONS } from '@/lib/messaging/types';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { QrCodeModal } from '@/components/instances/qr-code-modal';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, QrCode, Trash2, CheckCircle2, AlertCircle, Wifi, RefreshCw, Plug, ExternalLink, HelpCircle, Edit2, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PROVIDER_COLORS: Record<ProviderType, string> = {
    evolution: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 w-fit',
    zapi: 'bg-sky-500/10 text-sky-400 border-sky-500/20 w-fit',
    chatwoot: 'bg-violet-500/10 text-violet-400 border-violet-500/20 w-fit',
};

export default function InstancesPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [instances, setInstances] = useState<MessagingInstance[]>([]);
    const [isFetchingList, setIsFetchingList] = useState(true);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

    // Test connection state
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Create/Edit form state
    const [selectedProvider, setSelectedProvider] = useState<ProviderType>('zapi');
    const [newInstanceName, setNewInstanceName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingInstance, setEditingInstance] = useState<MessagingInstance | null>(null);

    // Z-API specific fields
    const [zapiInstanceId, setZapiInstanceId] = useState('');
    const [zapiToken, setZapiToken] = useState('');
    const [zapiClientToken, setZapiClientToken] = useState('');

    // Chatwoot manual config fields
    const [chatwootMode, setChatwootMode] = useState<'auto' | 'manual'>('manual');
    const [chatwootBaseUrl, setChatwootBaseUrl] = useState('');
    const [chatwootAccountId, setChatwootAccountId] = useState('');
    const [chatwootApiToken, setChatwootApiToken] = useState('');
    const [chatwootInboxId, setChatwootInboxId] = useState('');
    const [chatwootPhoneNumber, setChatwootPhoneNumber] = useState('');

    // QR Code modal (Evolution/Chatwoot only)
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [instanceForQr, setInstanceForQr] = useState<MessagingInstance | null>(null);

    const fetchInstances = useCallback(async () => {
        if (!user) return;
        setIsFetchingList(true);
        try {
            const fetchedInstances = await getMessagingInstances(user.uid);
            setInstances(fetchedInstances);
        } catch (e: any) {
            toast({ title: 'Erro ao buscar instâncias', description: e.message, variant: 'destructive' });
        } finally {
            setIsFetchingList(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Feature 2: Auto-refresh instance status every 30s
    const refreshStatuses = useCallback(async () => {
        if (!instances.length) return;
        setIsRefreshingStatus(true);
        try {
            const updated = await Promise.all(
                instances.map(async (inst) => {
                    try {
                        const result = await getInstanceConnectionState(
                            inst.name,
                            inst.provider || 'evolution',
                            inst.config
                        );
                        const state = result.data?.instance?.state || result.data?.state || inst.status;
                        return { ...inst, status: state };
                    } catch {
                        return inst;
                    }
                })
            );
            setInstances(updated);
        } finally {
            setIsRefreshingStatus(false);
        }
    }, [instances]);

    useEffect(() => {
        if (instances.length === 0) return;
        const interval = setInterval(refreshStatuses, 30000);
        return () => clearInterval(interval);
    }, [instances.length, refreshStatuses]);

    // Prevent page reload and data loss when creating or testing instance
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isCreating || isTesting) {
                const msg = "Operação em andamento. Fechar ou recarregar a página irá interromper o processo e você poderá perder a conexão ou a exibição do QR Code. Deseja sair?";
                e.preventDefault();
                e.returnValue = msg;
                return msg;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isCreating, isTesting]);

    // Feature 1: Test connection before creating
    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        const config: Record<string, string> = {};
        if (selectedProvider === 'zapi') {
            config.instanceId = zapiInstanceId;
            config.token = zapiToken;
            config.clientToken = zapiClientToken;
        }
        if (selectedProvider === 'chatwoot') {
            if (chatwootMode === 'manual') {
                config.baseUrl = chatwootBaseUrl;
                config.accountId = chatwootAccountId;
                config.apiAccessToken = chatwootApiToken;
                if (chatwootInboxId) config.inboxId = chatwootInboxId;
            } else {
                toast({ title: 'Verificação embutida', description: 'A integridade da conexão será verificada durante a criação automatizada.' });
                setIsTesting(false);
                return;
            }
        }

        const result = await testProviderConnection(selectedProvider, config);
        setTestResult(result);
        setIsTesting(false);

        toast({
            title: result.success ? 'Conexão OK' : 'Falha na conexão',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    };

    const resetForm = () => {
        setEditingInstance(null);
        setNewInstanceName('');
        setZapiInstanceId('');
        setZapiToken('');
        setZapiClientToken('');
        setChatwootMode('manual');
        setChatwootBaseUrl('');
        setChatwootAccountId('');
        setChatwootApiToken('');
        setChatwootInboxId('');
        setChatwootPhoneNumber('');
        setTestResult(null);
    };

    const handleEditClick = (instance: MessagingInstance) => {
        setEditingInstance(instance);
        setSelectedProvider(instance.provider || 'evolution');
        setNewInstanceName(instance.name);

        if (instance.provider === 'zapi' && instance.config) {
            const cfg = instance.config as any;
            setZapiInstanceId(cfg.instanceId || '');
            setZapiToken(cfg.token || '');
            setZapiClientToken(cfg.clientToken || '');
        }

        if (instance.provider === 'chatwoot' && instance.config) {
            setChatwootMode('manual');
            setChatwootBaseUrl((instance.config as any)?.baseUrl || '');
            setChatwootAccountId((instance.config as any)?.accountId || '');
            setChatwootApiToken((instance.config as any)?.apiAccessToken || '');
            setChatwootInboxId((instance.config as any)?.inboxId || '');
        }

        // Scroll to form smoothly
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleSaveInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validate provider-specific fields
        if (selectedProvider === 'zapi' && (!zapiInstanceId || !zapiToken || !zapiClientToken)) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos do Z-API.', variant: 'destructive' });
            return;
        }
        if (selectedProvider === 'chatwoot' && chatwootMode === 'manual' && (!chatwootBaseUrl || !chatwootAccountId || !chatwootApiToken)) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha URL, Account ID e API Token do Chatwoot.', variant: 'destructive' });
            return;
        }

        const providerConfig: Record<string, string> = {};
        if (selectedProvider === 'zapi') {
            providerConfig.instanceId = zapiInstanceId;
            providerConfig.token = zapiToken;
            providerConfig.clientToken = zapiClientToken;
        }
        if (selectedProvider === 'chatwoot') {
            if (chatwootMode === 'manual') {
                providerConfig.baseUrl = chatwootBaseUrl;
                providerConfig.accountId = chatwootAccountId;
                providerConfig.apiAccessToken = chatwootApiToken;
                if (chatwootInboxId) providerConfig.inboxId = chatwootInboxId;
            } else if (chatwootMode === 'auto') {
                if (!chatwootPhoneNumber) {
                    toast({ title: 'Campo obrigatório', description: 'Por favor, informe o telefone do WhatsApp.', variant: 'destructive' });
                    return;
                }
                providerConfig.phoneNumber = chatwootPhoneNumber;
            }
        }

        setIsCreating(true);
        const actionTitle = editingInstance ? 'A atualizar instância...' : 'A criar instância...';
        toast({ title: actionTitle, description: `Configurando ${PROVIDER_LABELS[selectedProvider]}...` });

        let result;
        if (editingInstance) {
            result = await updateMessagingInstance(editingInstance.id, newInstanceName, selectedProvider, providerConfig);
        } else {
            result = await createMessagingInstance(newInstanceName, user.uid, selectedProvider, providerConfig);
        }

        setIsCreating(false);

        if (result.success) {
            toast({ title: editingInstance ? 'Instância atualizada!' : 'Instância criada!', description: result.message });

            // Show QR Code for both Evolution and Chatwoot
            if (!editingInstance && (selectedProvider === 'evolution' || selectedProvider === 'chatwoot')) {
                const newInst = (result as any).data?.instance as MessagingInstance | undefined;
                if (newInst) {
                    setInstanceForQr(newInst);
                } else {
                    setInstanceForQr({ id: 'temp', name: newInstanceName, ownerId: user.uid, provider: selectedProvider, config: providerConfig, createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } });
                }
                setIsQrModalOpen(true);
            }

            resetForm();
            await fetchInstances();
        } else {
            toast({ variant: 'destructive', title: editingInstance ? 'Erro ao atualizar' : 'Erro ao criar instância', description: result.message });
        }
    };

    const handleSuccessfulConnection = () => {
        toast({ title: 'Conectado!', description: `A instância ${instanceForQr?.name} está pronta a ser utilizada.` });

        setTimeout(() => {
            setIsQrModalOpen(false);
            setInstanceForQr(null);
            fetchInstances();
        }, 2500);
    };

    const handleDeleteInstance = async (instance: MessagingInstance) => {
        const result = await deleteMessagingInstance(
            instance.name,
            instance.id,
            instance.provider || 'evolution',
            instance.config
        );
        if (result.success) {
            toast({ title: "Instância removida", description: result.message });
            await fetchInstances();
        } else {
            toast({ title: "Erro ao remover", description: result.message, variant: 'destructive' });
        }
    }

    const [isOpeningChatwoot, setIsOpeningChatwoot] = useState<string | null>(null);

    const handleOpenChatwoot = async (instance: MessagingInstance) => {
        if (!user) return;
        setIsOpeningChatwoot(instance.id);
        toast({ title: "Aguarde...", description: "A gerar login seguro no Chatwoot..." });

        const result = await getChatwootSsoUrl(instance.id, user.uid);
        setIsOpeningChatwoot(null);

        if (result.success && result.url) {
            window.open(result.url, '_blank');
        } else {
            toast({ title: "Erro de Acesso", description: result.message || "Falha ao gerar link do Chatwoot.", variant: 'destructive' });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge className='bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'><CheckCircle2 className='mr-1.5 h-3 w-3' />Conectado</Badge>;
            case 'connecting':
                return <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10"><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Conectando</Badge>;
            default:
                return <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"><AlertCircle className='mr-1.5 h-3 w-3' />Desconectado</Badge>;
        }
    }

    const getProviderBadge = (provider: ProviderType) => {
        return (
            <Badge className={`${PROVIDER_COLORS[provider] || 'bg-gray-100 text-gray-800'} font-medium text-[10px]`}>
                {PROVIDER_LABELS[provider] || provider}
            </Badge>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
                <CardHeader className='flex flex-row items-start justify-between border-b border-white/5 bg-white/5 pb-6'>
                    <div>
                        <CardTitle className="text-xl text-slate-100">Gerir Instâncias de Mensageria</CardTitle>
                        <CardDescription className="text-slate-400 mt-1">Crie, conecte e remova instâncias para os seus disparos de WhatsApp. Suportamos Evolution API, Z-API e Chatwoot.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={refreshStatuses} disabled={isRefreshingStatus || isFetchingList} className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                        {isRefreshingStatus ? 'Atualizando...' : 'Atualizar Status'}
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Instances List */}
                    <div className='border border-white/10 rounded-xl divide-y divide-white/5 bg-[#0A0A12]/50'>
                        {isFetchingList ? (
                            <div className='flex items-center justify-center p-8 text-muted-foreground gap-2'>
                                <Loader2 className="h-5 w-5 animate-spin" /> <span>A buscar instâncias...</span>
                            </div>
                        ) : instances.length > 0 ? (
                            instances.map(instance => (
                                <div key={instance.id} className="flex items-center justify-between p-4 gap-4 hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <div className='flex items-center gap-3'>
                                            <p className="font-semibold text-slate-200">{instance.name}</p>
                                            {getProviderBadge(instance.provider || 'evolution')}
                                        </div>
                                        <div className='flex items-center gap-3 mt-2'>
                                            {getStatusBadge(instance.status || 'unknown')}
                                            <p className="text-xs text-slate-500">Criada {formatDistanceToNow(new Date(instance.createdAt?.seconds ? instance.createdAt.seconds * 1000 : Date.now()), { addSuffix: true, locale: ptBR })}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        {/* QR Code for Evolution and Chatwoot (which provisions Evolution under the hood) */}
                                        {(instance.provider === 'evolution' || instance.provider === 'chatwoot') && (
                                            <Button variant="outline" size="sm" onClick={() => { setInstanceForQr(instance); setIsQrModalOpen(true); }} className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                                                <QrCode className='mr-2 h-4 w-4' /> QR Code
                                            </Button>
                                        )}
                                        {/* Connection info for Z-API */}
                                        {instance.provider === 'zapi' && (
                                            <Button variant="outline" size="sm" onClick={() => window.open('https://app.z-api.io', '_blank')} className="bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300">
                                                <Wifi className='mr-2 h-4 w-4' /> Painel Z-API
                                            </Button>
                                        )}
                                        {/* Login via SSO for Chatwoot */}
                                        {instance.provider === 'chatwoot' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenChatwoot(instance)}
                                                disabled={isOpeningChatwoot === instance.id}
                                                className="bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
                                            >
                                                {isOpeningChatwoot === instance.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className='mr-2 h-4 w-4' />}
                                                Abrir no Chatwoot
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => handleEditClick(instance)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white">Tem a certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        Esta ação irá remover permanentemente a instância <span className="font-bold text-white">"{instance.name}"</span> ({PROVIDER_LABELS[instance.provider || 'evolution']}) do nosso sistema. Não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteInstance(instance)} className="bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] border-0">
                                                        Confirmar Remoção
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='text-center p-8 text-slate-500'>Nenhuma instância encontrada. Crie uma abaixo.</div>
                        )}
                    </div>

                    {/* Create/Edit Instance Form */}
                    <div className="space-y-6 pt-8 mt-8 border-t border-white/5" id="instance-form">
                        <div className='mb-6'>
                            <h3 className="text-xl font-medium text-slate-100">{editingInstance ? 'Editar Instância' : 'Adicionar Nova Instância'}</h3>
                            <p className="text-sm text-slate-400 mt-1">{editingInstance ? 'Altere as credenciais ou o nome da sua instância.' : 'Preencha os dados abaixo para conectar uma nova mensageria. No Chatwoot, configuramos tudo magicamente para você!'}</p>
                        </div>
                        <form onSubmit={handleSaveInstance} className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="provider-select" className="text-slate-300">Provedor de Mensageria</Label>
                                <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as ProviderType)} disabled={!!editingInstance}>
                                    <SelectTrigger id="provider-select" className="bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl h-12 focus:ring-blue-500">
                                        <SelectValue placeholder="Selecione o provedor..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                        <SelectItem value="evolution" disabled className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mb-1 opacity-50">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">Evolution API (Em breve)</span>
                                                <span className="text-xs text-slate-500">{PROVIDER_DESCRIPTIONS.evolution}</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="zapi" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mb-1">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">Z-API</span>
                                                <span className="text-xs text-slate-500">{PROVIDER_DESCRIPTIONS.zapi}</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="chatwoot" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">Chatwoot</span>
                                                <span className="text-xs text-slate-500">{PROVIDER_DESCRIPTIONS.chatwoot}</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="instance-name" className="text-slate-300">Nome da Instância</Label>
                                <Input
                                    id="instance-name"
                                    placeholder={selectedProvider === 'chatwoot' ? 'Ex: Chatwoot_Produção' : 'Ex: Comercial_Equipa_A'}
                                    value={newInstanceName}
                                    onChange={(e) => setNewInstanceName(e.target.value)}
                                    className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-xl h-12 focus-visible:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Z-API specific fields */}
                            {selectedProvider === 'zapi' && (
                                <div className="space-y-4 p-5 bg-sky-900/10 rounded-xl border border-sky-500/20 shadow-inner">
                                    <div className='flex items-center justify-between'>
                                        <p className="text-sm font-medium text-sky-400">Credenciais Z-API</p>
                                        <a href="https://app.z-api.io" target="_blank" rel="noreferrer" className="text-xs text-sky-500 hover:text-sky-300 flex items-center gap-1 transition-colors">
                                            <ExternalLink className='h-3 w-3' /> Abrir Painel Z-API
                                        </a>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="zapi-instance-id" className='flex items-center gap-1 text-slate-300'>Instance ID</Label>
                                        <Input id="zapi-instance-id" placeholder="Ex: 3ED6D3D74138C...117FA2AA6C9A73C" value={zapiInstanceId} onChange={(e) => setZapiInstanceId(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-sky-500" />
                                        <p className='text-xs text-sky-500/80'>Encontre em app.z-api.io → Sua instância → Dados da instância</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="zapi-token" className="text-slate-300">Token</Label>
                                        <Input id="zapi-token" type="password" placeholder="Token de acesso da instância" value={zapiToken} onChange={(e) => setZapiToken(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-sky-500" />
                                        <p className='text-xs text-sky-500/80'>Token localizado junto ao Instance ID no painel</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="zapi-client-token" className="text-slate-300">Client Token</Label>
                                        <Input id="zapi-client-token" type="password" placeholder="Token do Client (Segurança)" value={zapiClientToken} onChange={(e) => setZapiClientToken(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-sky-500" />
                                        <p className='text-xs text-sky-500/80'>Encontre na aba Segurança do painel Z-API</p>
                                    </div>
                                </div>
                            )}

                            {/* Chatwoot config: toggle auto/manual */}
                            {selectedProvider === 'chatwoot' && (
                                <div className="space-y-4 p-5 bg-violet-900/10 rounded-xl border border-violet-500/20 shadow-inner">
                                    <div className='flex items-center justify-between'>
                                        <p className="text-sm font-medium text-violet-400">Configuração Chatwoot</p>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={isCreating} onClick={() => setChatwootMode('auto')} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${chatwootMode === 'auto' ? 'bg-violet-500/30 border-violet-500/50 text-violet-300' : 'border-white/10 text-slate-500 hover:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>✨ Automático</button>
                                            <button type="button" disabled={isCreating} onClick={() => setChatwootMode('manual')} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${chatwootMode === 'manual' ? 'bg-violet-500/30 border-violet-500/50 text-violet-300' : 'border-white/10 text-slate-500 hover:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>⚙️ Manual</button>
                                        </div>
                                    </div>

                                    {chatwootMode === 'auto' ? (
                                        <div className='flex flex-col gap-4'>
                                            <div className='flex items-start gap-4'>
                                                <div className="p-3 bg-violet-500/20 rounded-lg shrink-0">
                                                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-violet-400">Automação Chatwoot ✨</h4>
                                                    <p className="text-sm text-slate-400 mt-1">Basta dar um nome e um número. Criamos a caixa de entrada para o ID 1 automaticamente.</p>
                                                </div>
                                            </div>
                                            <div className="grid gap-2 mt-2">
                                                <Label htmlFor="cw-phone" className="text-slate-300">Telefone do WhatsApp</Label>
                                                <Input id="cw-phone" required placeholder="Ex: +5511999999999" value={chatwootPhoneNumber} onChange={e => setChatwootPhoneNumber(e.target.value)} className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-violet-500" />
                                                <p className="text-xs text-violet-500/80">Este telefone será exibido no Chatwoot para identificar a Caixa de Entrada.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="cw-url" className="text-slate-300">URL do Servidor Chatwoot</Label>
                                                <Input id="cw-url" placeholder="https://app.chatwoot.com" value={chatwootBaseUrl} onChange={e => setChatwootBaseUrl(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-violet-500" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cw-account" className="text-slate-300">Account ID</Label>
                                                    <Input id="cw-account" placeholder="Ex: 1" value={chatwootAccountId} onChange={e => setChatwootAccountId(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-violet-500" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cw-inbox" className="text-slate-300">Inbox ID <span className="text-slate-500">(opcional)</span></Label>
                                                    <Input id="cw-inbox" placeholder="Ex: 5" value={chatwootInboxId} onChange={e => setChatwootInboxId(e.target.value)} className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-violet-500" />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="cw-token" className="text-slate-300">API Access Token</Label>
                                                <Input id="cw-token" type="password" placeholder="Token de acesso (aba Preferências → Tokens de Acesso)" value={chatwootApiToken} onChange={e => setChatwootApiToken(e.target.value)} required className="bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-lg h-10 focus-visible:ring-violet-500" />
                                                <p className="text-xs text-violet-500/80">Perfil → Acesso às APIs no painel Chatwoot</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Test result message */}
                            {testResult && (
                                <div className={`p-4 rounded-xl text-sm font-medium border ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {testResult.message}
                                </div>
                            )}

                            <div className='flex flex-wrap gap-3 pt-2'>
                                {/* Test connection button (Z-API / Chatwoot only) */}
                                {selectedProvider !== 'evolution' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTestConnection}
                                        disabled={isTesting || isCreating}
                                        className="bg-transparent border-white/20 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11 px-6"
                                    >
                                        {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
                                        {isTesting ? 'Testando...' : 'Testar Conexão'}
                                    </Button>
                                )}

                                <Button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0 h-11 px-6">
                                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingInstance ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                                    {editingInstance ? 'Guardar Alterações' : ((selectedProvider === 'evolution' || selectedProvider === 'chatwoot') ? 'Criar e Conectar' : 'Registrar Instância')}
                                </Button>
                                {editingInstance && (
                                    <Button type="button" variant="ghost" onClick={resetForm} disabled={isCreating} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl">Cancelar Edição</Button>
                                )}
                            </div>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* QR Code Modal (Evolution only) */}
            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
                <DialogContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">Conectar Instância: {instanceForQr?.name}</DialogTitle>
                        <DialogDescription className="sr-only">Escaneie o QR Code retornado para conectar o WhatsApp.</DialogDescription>
                    </DialogHeader>
                    {instanceForQr && (
                        <QrCodeModal
                            instance={instanceForQr}
                            onConnected={handleSuccessfulConnection}
                        />
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" className="bg-transparent border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">Fechar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
