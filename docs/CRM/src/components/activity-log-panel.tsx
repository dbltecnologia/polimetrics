// src/components/activity-log-panel.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFunnelCampaignLogs } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
    created_at: string;
    event_type: string;
    message: string;
}

const EVENT_COLORS: Record<string, string> = {
    info: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    success: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
};

export function ActivityLogPanel({ funnelId, funnelName }: { funnelId: string; funnelName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [filter, setFilter] = useState('all');
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = useCallback(async () => {
        if (!funnelId) return;
        try {
            const data = await getFunnelCampaignLogs(funnelId);
            setLogs((data || []) as LogEntry[]);
        } catch {
            // Silently fail — logs may not exist yet
        }
    }, [funnelId]);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            fetchLogs().finally(() => setIsLoading(false));

            // Poll every 5s while open
            const interval = setInterval(() => {
                setIsPolling(true);
                fetchLogs().finally(() => setIsPolling(false));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchLogs]);

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(l => l.event_type?.toLowerCase() === filter);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className='h-8 w-8' title="Logs de Atividade">
                    <Filter className='h-4 w-4 text-orange-500' />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                <DialogHeader className="pb-4 border-b border-white/5">
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                            <DialogTitle className="text-xl text-slate-100 flex items-center gap-2">
                                <Filter className="h-5 w-5 text-orange-500" />
                                Logs de Atividade
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">{funnelName}</DialogDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className='w-[130px] h-9 bg-[#12121A] border-white/10 text-slate-200 rounded-lg'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                    <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Todos</SelectItem>
                                    <SelectItem value="info" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Info</SelectItem>
                                    <SelectItem value="success" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Sucesso</SelectItem>
                                    <SelectItem value="error" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Erros</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => { setIsPolling(true); fetchLogs().finally(() => setIsPolling(false)); }} className='h-9 w-9 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg'>
                                <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin text-blue-400' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="h-[60vh] border border-white/5 rounded-xl p-4 bg-[#12121A]/80 shadow-inner" ref={scrollRef}>
                    {isLoading ? (
                        <div className='flex items-center justify-center h-32'>
                            <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="space-y-2 font-mono text-[13px]">
                            {filteredLogs.map((log, i) => {
                                const eventStyles = EVENT_COLORS[log.event_type?.toLowerCase()] || EVENT_COLORS.info;
                                return (
                                    <div key={i} className='flex items-start gap-3 leading-relaxed hover:bg-white/[0.02] p-1.5 rounded-md transition-colors'>
                                        <span className='text-slate-500 flex-shrink-0 mt-0.5'>
                                            {(() => { try { return format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR }); } catch { return '--:--:--'; } })()}
                                        </span>
                                        <Badge variant="outline" className={`flex-shrink-0 text-[10px] px-1.5 py-0 rounded font-semibold tracking-wider ${eventStyles}`}>
                                            {log.event_type?.toUpperCase() || 'INFO'}
                                        </Badge>
                                        <span className={`text-slate-300 break-words`}>
                                            {log.message}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full mt-20 opacity-50">
                            <Filter className="h-10 w-10 text-slate-500 mb-4" />
                            <p className='text-center text-slate-400 text-sm italic'>
                                Nenhum log de atividade encontrado para este funil.
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
