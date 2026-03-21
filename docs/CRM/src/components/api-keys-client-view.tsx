// src/components/api-keys-client-view.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, PlusCircle, Trash2, Loader2, Copy, Check } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { format } from 'date-fns';
import { generateApiKey, getApiKeys, deleteApiKey, type ApiKey } from '@/lib/actions';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

type ApiKeyType = 'external' | 'whatsapp';

export function ApiKeysClientView() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyType, setNewKeyType] = useState<ApiKeyType>('external');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

    const fetchKeys = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const userKeys = await getApiKeys(user.uid);
            setKeys(userKeys);
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível carregar as chaves de API.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleGenerateKey = async () => {
        if (!user) return;
        if (!newKeyName.trim()) {
            toast({ title: "Erro", description: "O nome da chave é obrigatório.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const { fullKey } = await generateApiKey(user.uid, newKeyName, newKeyType);
            setGeneratedKey(fullKey);
            await fetchKeys();
        } catch (error: any) {
            toast({ title: "Erro ao Gerar Chave", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
            setNewKeyName('');
            // Don't close the dialog automatically, show the key first.
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!user) return;
        setIsProcessing(true);
        try {
            await deleteApiKey(keyId, user.uid);
            toast({ title: "Sucesso", description: "Chave de API revogada com sucesso." });
            await fetchKeys();
        } catch (error: any) {
            toast({ title: "Erro ao Revogar", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        if (!generatedKey) return;
        navigator.clipboard.writeText(generatedKey);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleCloseCreateDialog = () => {
        setGeneratedKey(null);
        setHasCopied(false);
        setIsCreateDialogOpen(false);
        setNewKeyType('external');
    }

    const getTypeLabel = (type?: 'external' | 'whatsapp') => {
        switch (type) {
            case 'whatsapp':
                return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-medium">Servidor WhatsApp</Badge>;
            case 'external':
            default:
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-medium">API Externa</Badge>;
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 shadow-inner">
                                <KeyRound className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-slate-100">Chaves de Acesso da API</CardTitle>
                                <CardDescription className="text-slate-400 mt-1">Gerencie chaves para integrações externas e para o servidor de WhatsApp.</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0 h-11 w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Gerar Nova Chave
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl text-slate-100">{generatedKey ? 'Chave Gerada com Sucesso!' : 'Gerar Nova Chave de Acesso'}</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        {generatedKey ?
                                            'Copie esta chave e guarde-a em um lugar seguro. Você não poderá vê-la novamente.' :
                                            'Dê um nome para sua chave e defina seu tipo de uso.'
                                        }
                                    </DialogDescription>
                                </DialogHeader>

                                {generatedKey ? (
                                    <div className='py-4 space-y-4'>
                                        <div className='relative'>
                                            <Input value={generatedKey} readOnly className="pr-10 font-mono text-sm bg-[#12121A]/80 border-white/10 text-slate-200 rounded-xl h-11" />
                                            <Button size="icon" variant="ghost" className="absolute top-1/2 right-1.5 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10" onClick={handleCopy}>
                                                {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">Atenção: Esta é a única vez que a chave completa será exibida.</Badge>
                                    </div>
                                ) : (
                                    <div className="space-y-5 py-4">
                                        <div className="grid gap-2">
                                            <Label className="text-slate-300">Nome da Chave</Label>
                                            <Input
                                                placeholder="Ex: Integração Sistema ERP"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                                disabled={isProcessing}
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()}
                                                className="bg-[#12121A]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl h-11"
                                            />
                                        </div>
                                        <RadioGroup defaultValue="external" value={newKeyType} onValueChange={(value: ApiKeyType) => setNewKeyType(value)}>
                                            <Label className="text-slate-300">Tipo de Chave</Label>
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 pt-3">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="external" id="r1" className="border-white/20 text-blue-500" />
                                                    <Label htmlFor="r1" className="text-slate-300 cursor-pointer">API Externa</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="whatsapp" id="r2" className="border-white/20 text-emerald-500" />
                                                    <Label htmlFor="r2" className="text-slate-300 cursor-pointer">Servidor WhatsApp</Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}

                                <DialogFooter className="mt-2">
                                    <Button variant="secondary" onClick={handleCloseCreateDialog} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Fechar</Button>
                                    {!generatedKey && (
                                        <Button onClick={handleGenerateKey} disabled={isProcessing || !newKeyName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar Chave'}
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="border border-white/10 rounded-xl bg-[#0A0A12]/50">
                        <div className="divide-y divide-white/5">
                            {keys.length > 0 ? (
                                keys.map(key => (
                                    <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/[0.02] transition-colors">
                                        <div className='space-y-1.5'>
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold text-slate-200">{key.name}</p>
                                                {getTypeLabel(key.type)}
                                            </div>
                                            <p className="text-sm text-slate-400 font-mono">
                                                Chave começa com: <span className="font-bold text-slate-300">{key.prefix}</span>
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Criada em: {format(new Date(key.createdAt.seconds * 1000), "dd/MM/yyyy HH:mm")}
                                            </p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 rounded-lg bg-transparent">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Revogar
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#0A0A12] border-white/10 text-slate-200 shadow-xl rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-slate-100">Revogar chave "{key.name}"?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        Esta ação não pode ser desfeita. Qualquer aplicação usando esta chave perderá o acesso imediatamente.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteKey(key.id)} className="bg-red-600 hover:bg-red-500 text-white shadow-none rounded-xl">
                                                        Confirmar Revogação
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <KeyRound className="mx-auto h-8 w-8 mb-3 opacity-20" />
                                    <p>Você ainda não gerou nenhuma chave de acesso.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
