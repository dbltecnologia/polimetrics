// src/components/compare-funnels-client-view.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { getFunnels } from '@/lib/actions';
import { compareFunnelsForConflicts, type ConflictLeadResult } from '@/ai/flows/compare-funnels-flow';
import { updateLeadsStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, GitCompareArrows, ShieldAlert, Trash2, Phone, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Input } from './ui/input';

type FunnelInfo = {
    id: string;
    name: string;
    recordCount: number;
};

export function CompareFunnelsClientView() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [funnels, setFunnels] = useState<FunnelInfo[]>([]);
    const [sourceFunnelId, setSourceFunnelId] = useState<string>('');
    const [sourceFunnelName, setSourceFunnelName] = useState<string>('');
    const [targetFunnelId, setTargetFunnelId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isComparing, setIsComparing] = useState(false);
    const [isInvalidating, setIsInvalidating] = useState(false);
    const [conflicts, setConflicts] = useState<ConflictLeadResult[]>([]);
    
    const fetchFunnelsList = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const result = await getFunnels(user.uid);
            setFunnels(result.data);
            
            const activeFunnelId = sessionStorage.getItem('activeUploadId');
            const activeFunnelName = sessionStorage.getItem('activeFunnelName');
            if (activeFunnelId && result.data.some(f => f.id === activeFunnelId)) {
                setSourceFunnelId(activeFunnelId);
                setSourceFunnelName(activeFunnelName || 'Funil Ativo');
            }

        } catch (error: any) {
            toast({ title: "Erro ao carregar funis", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        const handleStorageChange = () => {
            const activeId = sessionStorage.getItem('activeUploadId');
            const activeName = sessionStorage.getItem('activeFunnelName');
            setSourceFunnelId(activeId || '');
            setSourceFunnelName(activeName || '');
        };
        
        fetchFunnelsList(); // Initial fetch
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [fetchFunnelsList]);

    const handleCompare = async () => {
        if (!sourceFunnelId || !targetFunnelId) {
            toast({ title: 'Seleção necessária', description: 'Por favor, selecione o funil de destino para comparar.', variant: 'destructive' });
            return;
        }
        if (sourceFunnelId === targetFunnelId) {
            toast({ title: 'Seleção inválida', description: 'Você não pode comparar um funil com ele mesmo.', variant: 'destructive' });
            return;
        }

        setIsComparing(true);
        setConflicts([]);
        try {
            const result = await compareFunnelsForConflicts({
                sourceFunnelId,
                targetFunnelId,
                contactWindowDays: 14 // Fixo por enquanto, pode ser movido para settings
            });
            setConflicts(result.conflicts);
            if (result.conflicts.length === 0) {
                toast({ title: 'Nenhum conflito encontrado', description: 'Não há leads duplicados ou contatados recentemente no funil de destino.' });
            } else {
                 toast({ title: 'Comparação concluída', description: `${result.conflicts.length} conflito(s) encontrado(s).` });
            }
        } catch (error: any) {
            toast({ title: "Erro na comparação", description: error.message, variant: "destructive" });
        } finally {
            setIsComparing(false);
        }
    };
    
    const handleInvalidateConflicts = async () => {
        if (conflicts.length === 0 || !targetFunnelId) return;

        setIsInvalidating(true);
        try {
            const leadsToUpdate = conflicts.map(conflict => {
                let note = 'Status alterado para "Inválido" automaticamente.';
                if (conflict.reasons.includes('duplicate')) {
                    note += ` Motivo: Duplicata por telefone encontrada no funil "${sourceFunnelName}".`;
                } else if (conflict.reasons.includes('recent_contact')) {
                    note += ` Motivo: Contato recente identificado no mesmo funil.`;
                }
                return {
                    id: conflict.targetLead.id,
                    interactionNote: note
                };
            });
            
            const result = await updateLeadsStatus(targetFunnelId, leadsToUpdate.map(l => l.id), 'Inválido', {
                getInteractionNote: (leadId) => {
                    return leadsToUpdate.find(l => l.id === leadId)?.interactionNote || 'Status alterado para "Inválido" por sistema de comparação.';
                }
            });
            
            toast({
                title: 'Conflitos invalidados!',
                description: `${result.count} leads foram marcados como "Inválido" no funil de destino.`
            });
            
            setConflicts([]);

        } catch (error: any) {
            toast({ title: "Erro ao invalidar", description: error.message, variant: "destructive" });
        } finally {
            setIsInvalidating(false);
        }
    };


    const getFunnelName = (id: string) => funnels.find(f => f.id === id)?.name || 'Funil';

    const targetFunnels = useMemo(() => funnels.filter(f => f.id !== sourceFunnelId), [funnels, sourceFunnelId]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
    }

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <GitCompareArrows className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Comparar Funis</h1>
                    <p className="text-muted-foreground">Encontre leads duplicados (por telefone) ou recentemente contatados entre dois funis.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Selecione os Funis</CardTitle>
                    <CardDescription>O funil de origem é o seu funil ativo. Escolha um funil de destino para encontrar conflitos.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full space-y-1">
                        <label className="text-sm font-medium">Funil de Origem (Ativo)</label>
                         <Input 
                            value={sourceFunnelName || 'Nenhum funil ativo selecionado'} 
                            readOnly 
                            disabled
                            className="font-semibold"
                        />
                    </div>
                     <div className="w-full space-y-1">
                        <label className="text-sm font-medium">Funil de Destino (para limpar)</label>
                        <Select value={targetFunnelId} onValueChange={setTargetFunnelId}>
                            <SelectTrigger><SelectValue placeholder="Selecione o funil a ser comparado..." /></SelectTrigger>
                            <SelectContent>
                                {targetFunnels.map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.recordCount} leads)</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCompare} disabled={isComparing || !sourceFunnelId} className="w-full md:w-auto self-end">
                        {isComparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GitCompareArrows className="mr-2 h-4 w-4" />}
                        Comparar
                    </Button>
                </CardContent>
            </Card>
            
            {conflicts.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Resultados da Comparação</CardTitle>
                                <CardDescription>{conflicts.length} conflito(s) encontrado(s).</CardDescription>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isInvalidating}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Invalidar Conflitos no Destino
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação mudará o status de {conflicts.length} leads no funil "{getFunnelName(targetFunnelId)}" para "Inválido". Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleInvalidateConflicts} className="bg-destructive hover:bg-destructive/90">
                                            {isInvalidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Confirmar Invalidação'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lead em Conflito (no Destino)</TableHead>
                                    <TableHead>Motivo do Conflito</TableHead>
                                    <TableHead>Lead Correspondente (na Origem)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conflicts.map((conflict, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <p className="font-semibold">{conflict.targetLead.title || conflict.targetLead.name}</p>
                                            <p className="text-sm text-muted-foreground">{conflict.targetLead.phone}</p>
                                            <Badge variant="outline">{getFunnelName(conflict.targetLead.uploadId)}</Badge>
                                        </TableCell>
                                         <TableCell>
                                            <div className='flex flex-col gap-1'>
                                                {conflict.reasons.map(reason => (
                                                     <Badge key={reason} variant={reason === 'duplicate' ? 'destructive' : 'secondary'} className='w-fit'>
                                                        {reason === 'duplicate' ? <Phone className='mr-1.5 h-3 w-3' /> : <MessageSquare className='mr-1.5 h-3 w-3'/>}
                                                        {reason === 'duplicate' ? 'Duplicata' : 'Contato Recente'}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {conflict.sourceLead ? (
                                                <>
                                                    <p className="font-semibold">{conflict.sourceLead.title || conflict.sourceLead.name}</p>
                                                     <p className="text-sm text-muted-foreground">{conflict.sourceLead.phone}</p>
                                                    <Badge variant="outline">{getFunnelName(conflict.sourceLead.uploadId)}</Badge>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">N/A (conflito por contato recente)</p>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {isComparing && (
                 <div className="text-center p-8">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Analisando... Isso pode levar um momento.</p>
                </div>
            )}
        </main>
    );
}
