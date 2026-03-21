// src/components/funnel-detail-client-view.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getFunnelCampaignDetails, getFunnelCampaignLogs, getFunnelCampaignContacts } from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CampaignDetails {
    name: string;
    status: string;
    total_contacts: number;
    contacts_done: number;
    contacts_failed: number;
}

interface LogEntry {
    created_at: string;
    event_type: string;
    message: string;
}

interface Contact {
    id: string;
    name: string;
    phone: string;
    status: string;
}

const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'sent':
        case 'contatado':
            return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold tracking-wide">Enviado</Badge>;
        case 'pending':
        case 'pendente':
            return <Badge className="bg-slate-800/80 text-slate-300 border-slate-600 font-bold tracking-wide">Pendente</Badge>;
        case 'failed':
        case 'falhou':
            return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-bold tracking-wide">Falhou</Badge>;
        case 'concluído':
            return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-wide">Concluído</Badge>;
        default:
            return <Badge className="bg-slate-800/80 text-slate-300 border-slate-600 font-bold tracking-wide">{status || 'Pendente'}</Badge>;
    }
};

const getCampaignStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'ativa':
        case 'running':
        case 'starting':
            return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold tracking-wide shadow-[0_0_10px_rgba(16,185,129,0.2)]">Ativa</Badge>;
        case 'parada':
        case 'stopped':
        case 'stopping':
            return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold tracking-wide">Parada</Badge>;
        case 'concluida':
        case 'completed':
            return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-wide">Concluída</Badge>;
        case 'failed':
            return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-bold tracking-wide">Falhou</Badge>;
        default:
            return <Badge className="bg-slate-800/80 text-slate-300 border-slate-600 font-bold tracking-wide">{status || 'Pendente'}</Badge>;
    }
};


export function FunnelDetailClientView() {
    const params = useParams();
    const funnelId = params.id as string;
    const router = useRouter();
    const { toast } = useToast();

    const [details, setDetails] = useState<CampaignDetails | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);

    // Filtros
    const [searchFilter, setSearchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchData = useCallback(async () => {
        if (!funnelId) return;
        setIsPolling(true);
        try {
            const [detailsData, logsData, contactsData] = await Promise.all([
                getFunnelCampaignDetails(funnelId),
                getFunnelCampaignLogs(funnelId),
                getFunnelCampaignContacts(funnelId)
            ]);

            if (detailsData) setDetails(detailsData as any);
            if (logsData) setLogs(logsData as any);
            if (contactsData) setContacts(contactsData as any);

        } catch (error: any) {
            console.error("Failed to fetch campaign data:", error);
            toast({ title: 'Erro ao buscar dados', description: error.message || 'Não foi possível carregar os dados da campanha.', variant: 'destructive' });
            setDetails(null);
            setLogs([]);
            setContacts([]);
        } finally {
            setIsLoading(false);
            setIsPolling(false);
        }
    }, [funnelId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const isCampaignActive = details?.status === 'running' || details?.status === 'starting';
        let intervalId: NodeJS.Timeout | undefined;
        if (isCampaignActive) {
            intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        }
    }, [details?.status, fetchData]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const statusMatch = statusFilter === 'all' || contact.status?.toLowerCase() === statusFilter.toLowerCase();
            const searchLower = searchFilter.toLowerCase();
            const searchMatch = !searchFilter ||
                contact.name?.toLowerCase().includes(searchLower) ||
                contact.phone?.toLowerCase().includes(searchLower);
            return statusMatch && searchMatch;
        });
    }, [contacts, statusFilter, searchFilter]);


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (!details) {
        return (
            <div className="flex flex-col h-screen items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold mb-2">Campanha não encontrada</h2>
                <p className="text-muted-foreground mb-4">Não foi possível carregar os detalhes para este funil/campanha.</p>
                <Button onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
            </div>
        )
    }

    const progress = details.total_contacts > 0 ? (details.contacts_done / details.total_contacts) * 100 : 0;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-[#0A0A12] min-h-screen text-slate-50 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="flex items-center justify-between relative z-10">
                <div className='space-y-1 block'>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">{details.name}</h1>
                    <div className='flex items-center gap-3 mt-1'>
                        <span className="text-sm font-medium text-slate-400">Status:</span>
                        {getCampaignStatusBadge(details.status)}
                    </div>
                </div>
                <Button onClick={() => router.back()} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl shadow-sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
                <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl shadow-xl hover:bg-[#12121A]/80 transition-colors">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Leads na Campanha</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-extrabold text-blue-400">{details.total_contacts}</div></CardContent>
                </Card>
                <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl shadow-xl hover:bg-[#12121A]/80 transition-colors">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Disparos Realizados</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-extrabold text-white">{details.contacts_done}</div></CardContent>
                </Card>
                <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl shadow-xl hover:bg-[#12121A]/80 transition-colors">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Falhas no Envio</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-extrabold text-red-400">{details.contacts_failed}</div></CardContent>
                </Card>
                <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl shadow-xl hover:bg-[#12121A]/80 transition-colors">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Progresso</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-extrabold text-emerald-400">{progress.toFixed(1)}%</div></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                <Card className="bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl flex flex-col h-[600px]">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <div>
                            <CardTitle className="text-xl text-slate-100">Leads da Campanha</CardTitle>
                            <CardDescription className="text-slate-400 mt-1">Os leads que estão sendo contatados nesta campanha.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Filtrar por nome ou telefone..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="w-full pl-10 h-10 bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[200px] h-10 bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl">
                                    <SelectValue placeholder="Filtrar por status..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-xl">
                                    <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer">Todos os Status</SelectItem>
                                    <SelectItem value="Pendente" className="focus:bg-white/10 focus:text-white cursor-pointer">Pendente</SelectItem>
                                    <SelectItem value="Contatado" className="focus:bg-white/10 focus:text-white cursor-pointer">Enviado</SelectItem>
                                    <SelectItem value="Falhou" className="focus:bg-white/10 focus:text-white cursor-pointer">Falhou</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-[#0A0A12] z-10">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-slate-400 text-xs uppercase tracking-wider pl-6">Nome</TableHead>
                                        <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Telefone</TableHead>
                                        <TableHead className="text-slate-400 text-xs uppercase tracking-wider pr-6">Status do Envio</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-white/5">
                                    {filteredContacts.length > 0 ? filteredContacts.map((contact, index) => (
                                        <TableRow key={index} className="border-white/5 hover:bg-white/[0.03] transition-colors">
                                            <TableCell className="font-medium text-slate-200 pl-6">{contact.name}</TableCell>
                                            <TableCell className="text-slate-400 font-mono text-sm">{contact.phone}</TableCell>
                                            <TableCell className="pr-6">{getStatusBadge(contact.status)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-slate-500">Nenhum lead encontrado para os filtros aplicados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl flex flex-col h-[600px]">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <CardTitle className="text-xl text-slate-100">Logs da Campanha</CardTitle>
                            <CardDescription className="text-slate-400 mt-1">Eventos em tempo real dos disparos.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchData} disabled={isPolling} className="text-slate-400 hover:text-white hover:bg-white/10 shrink-0">
                            <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden bg-[#0A0A12]/50">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-3 font-mono text-[13px] tracking-tight">
                                {logs.length > 0 ? logs.map((log, index) => {
                                    const isError = log.event_type.toLowerCase() === 'error';
                                    const isSuccess = log.event_type.toLowerCase() === 'success';
                                    return (
                                        <p key={index} className="leading-relaxed whitespace-pre-wrap">
                                            <span className='text-slate-500 mr-2'>
                                                {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                                            </span>
                                            <span className={`${isError ? 'text-red-400 font-semibold' : isSuccess ? 'text-emerald-400 font-semibold' : 'text-blue-400'}`}>
                                                [{log.event_type.toUpperCase()}]
                                            </span>
                                            <span className={`ml-2 ${isError ? 'text-red-300' : isSuccess ? 'text-slate-200' : 'text-slate-300'}`}>
                                                {log.message}
                                            </span>
                                        </p>
                                    );
                                }) : (
                                    <div className='flex flex-col items-center justify-center h-48 text-center text-slate-500 opacity-70'>
                                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-slate-600" />
                                        <p className="italic">Aguardando início dos disparos...</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
