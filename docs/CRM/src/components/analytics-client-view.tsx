
// src/components/analytics-client-view.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getOutreachPlans, getAnalysisReports } from '@/lib/actions';
import { BarChart3, Loader2, Download, Eye, ArrowUpDown, AlertTriangle, FileText, Bot, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { OutreachItem } from '@/types/ai-types';
import NextLink from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


type EnrichedOutreachItem = OutreachItem & {
    planCreatedAt: Date;
    funnelId: string;
    funnelName: string;
};

type SortConfig = { key: keyof EnrichedOutreachItem; direction: 'ascending' | 'descending' } | null;

const statusOptions = ['Todos', 'Pendente', 'Contatado', 'Concluído', 'Falhou'];

export function AnalyticsClientView() {
    const [allItems, setAllItems] = useState<EnrichedOutreachItem[]>([]);
    const [analysisReports, setAnalysisReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'planCreatedAt', direction: 'descending' });
    const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
    const [activeFunnelName, setActiveFunnelName] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Read the tab from URL search params
    const defaultTab = searchParams.get('tab') === 'analysis' ? 'analysis' : 'outreaches';

    const fetchFunnelData = useCallback(async (funnelId: string | null) => {
        if (!funnelId) {
            setAllItems([]);
            return;
        }

        const funnelName = sessionStorage.getItem('activeFunnelName');
        setActiveFunnelName(funnelName);

        try {
            const { data: plans } = await getOutreachPlans(funnelId);
            let consolidatedItems: EnrichedOutreachItem[] = [];

            for (const plan of plans) {
                const planItems = plan.planData.map((item: OutreachItem) => ({
                    ...item,
                    planCreatedAt: new Date(plan.createdAt.seconds * 1000),
                    funnelId: funnelId,
                    funnelName: funnelName || 'Funil',
                }));
                consolidatedItems = [...consolidatedItems, ...planItems];
            }
            setAllItems(consolidatedItems);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            toast({ title: 'Erro ao buscar dados de envio', description: 'Não foi possível carregar os relatórios de envio.', variant: 'destructive' });
        }
    }, [toast]);

    const fetchAnalysisReports = useCallback(async () => {
        if (!user) return;
        try {
            const reports = await getAnalysisReports(user.uid);
            setAnalysisReports(reports);
        } catch (error) {
            console.error('Failed to fetch analysis reports:', error);
            toast({ title: 'Erro ao buscar relatórios de análise', description: 'Não foi possível carregar o histórico de análises.', variant: 'destructive' });
        }
    }, [user, toast]);

    const handleStorageChange = useCallback(() => {
        const funnelId = sessionStorage.getItem('activeUploadId');
        setActiveFunnelId(funnelId);
        fetchFunnelData(funnelId);
        fetchAnalysisReports(); // Also refresh analysis reports
    }, [fetchFunnelData, fetchAnalysisReports]);

    useEffect(() => {
        setIsLoading(true);
        const funnelId = sessionStorage.getItem('activeUploadId');
        setActiveFunnelId(funnelId);

        Promise.all([
            fetchFunnelData(funnelId),
            fetchAnalysisReports()
        ]).finally(() => {
            setIsLoading(false);
        });

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchFunnelData, fetchAnalysisReports, handleStorageChange]);


    const filteredItems = useMemo(() => {
        let items = allItems;

        if (statusFilter !== 'Todos') {
            items = items.filter(item => item.status === statusFilter);
        }

        if (dateRange?.from) {
            items = items.filter(item => item.planCreatedAt >= dateRange.from!);
        }
        if (dateRange?.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999); // Include the whole day
            items = items.filter(item => item.planCreatedAt <= toDate);
        }

        if (sortConfig !== null) {
            items.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (aVal < bVal) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return items;
    }, [allItems, statusFilter, dateRange, sortConfig]);

    const handleSort = (key: keyof EnrichedOutreachItem) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(`Relatório de Envios - Funil: ${activeFunnelName}`, 14, 16);
        (doc as any).autoTable({
            head: [['Data Envio', 'Contato', 'Número', 'Status']],
            body: filteredItems.map(item => [
                format(item.planCreatedAt, "dd/MM/yyyy HH:mm"),
                item.leadName,
                item.phone || 'N/A',
                item.status,
            ]),
            startY: 20
        });
        doc.save(`relatorio_envios_${activeFunnelName}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredItems.map(item => ({
            "Data Envio": format(item.planCreatedAt, "yyyy-MM-dd HH:mm"),
            "Contato": item.leadName,
            "Número": item.phone || 'N/A',
            "Status": item.status,
            "Mensagem Sugerida": item.suggestedMessage,
            "ID do Lead": item.leadId
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Envios");
        XLSX.writeFile(workbook, `relatorio_envios_${activeFunnelName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const renderLoading = () => (
        <div className="flex-1 flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    const renderNoFunnelSelected = () => (
        <Card className="flex-1 flex flex-col justify-center items-center p-8 text-center max-w-lg mx-auto mt-8 bg-[#12121A]/60 border-white/5 backdrop-blur-xl shadow-2xl rounded-2xl">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            <h2 className="text-2xl font-bold mb-2 text-slate-100">Nenhum Funil Selecionado</h2>
            <p className="text-slate-400 mb-6">
                Por favor, selecione um funil na barra de navegação superior para ver o relatório de envios.
            </p>
            <NextLink href="/import" passHref>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0 px-6 h-11">Importar ou Gerenciar Funis</Button>
            </NextLink>
        </Card>
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="mr-1.5 h-3 w-3" />Concluído</Badge>;
            case 'Failed':
                return <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="mr-1.5 h-3 w-3" />Falhou</Badge>;
            case 'Running':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30"><Clock className="mr-1.5 h-3 w-3 animate-spin" />Em andamento</Badge>;
            default:
                return <Badge variant="outline" className="border-white/20 text-slate-300 bg-white/5">{status}</Badge>;
        }
    };


    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Relatórios</h1>
                        <p className="text-slate-400">Analise as prospecções e o resultado das análises de IA.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-[#12121A]/60 border border-white/5 backdrop-blur-xl rounded-xl p-1 h-auto">
                    <TabsTrigger value="outreaches" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 py-2.5 transition-all">Envios de Prospecção</TabsTrigger>
                    <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 py-2.5 transition-all">Relatórios de Análise</TabsTrigger>
                </TabsList>

                <TabsContent value="outreaches" className="flex-1 flex flex-col mt-4">
                    {isLoading ? renderLoading() : !activeFunnelId ? renderNoFunnelSelected() : (
                        <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                                <CardTitle className="text-xl text-slate-100">Filtros e Ações - Envios</CardTitle>
                                <CardDescription className="text-slate-400">Visualize os envios de prospecção para o funil <span className='font-bold text-white'>{activeFunnelName}</span>.</CardDescription>
                                <div className="flex flex-col md:flex-row gap-2 pt-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full md:w-[180px] bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl h-11 focus:ring-blue-500">
                                            <SelectValue placeholder="Filtrar por status..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                            {statusOptions.map(opt => <SelectItem key={opt} value={opt} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg">{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full md:w-[300px] justify-start text-left font-normal bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl h-11 hover:bg-white/5 hover:text-white", !dateRange && "text-slate-500")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                                            {format(dateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Selecione um período</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-[#0A0A12] border-white/10 shadow-xl rounded-xl" align="start">
                                            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="text-slate-200" />
                                        </PopoverContent>
                                    </Popover>
                                    <Button variant="ghost" onClick={() => setDateRange(undefined)} className="w-full md:w-auto h-11 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl">Limpar</Button>
                                    <div className="flex-grow" />
                                    <Button onClick={exportToPDF} variant="outline" disabled={isLoading || filteredItems.length === 0} className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11"><Download className="mr-2 h-4 w-4" />Exportar PDF</Button>
                                    <Button onClick={exportToExcel} variant="outline" disabled={isLoading || filteredItems.length === 0} className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11"><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="border border-white/10 rounded-xl bg-[#0A0A12]/50 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-white/5 border-b border-white/10">
                                            <TableRow className="hover:bg-transparent border-b-0">
                                                <TableHead className="text-slate-300"><Button variant="ghost" className="hover:bg-white/10 hover:text-white text-slate-300 font-semibold" onClick={() => handleSort('planCreatedAt')}>Data Envio <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                                <TableHead className="text-slate-300"><Button variant="ghost" className="hover:bg-white/10 hover:text-white text-slate-300 font-semibold" onClick={() => handleSort('leadName')}>Contato <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                                <TableHead className="text-slate-300 font-semibold">Número</TableHead>
                                                <TableHead className="text-slate-300"><Button variant="ghost" className="hover:bg-white/10 hover:text-white text-slate-300 font-semibold" onClick={() => handleSort('status')}>Status <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                                <TableHead className="text-right text-slate-300 font-semibold">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.length > 0 ? filteredItems.map(item => (
                                                <TableRow key={`${item.funnelId}-${item.leadId}-${item.planCreatedAt.toISOString()}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <TableCell className="text-slate-300">{format(item.planCreatedAt, "dd/MM/yyyy HH:mm")}</TableCell>
                                                    <TableCell className="font-medium text-slate-100">{item.leadName}</TableCell>
                                                    <TableCell className="text-slate-400">{item.phone || 'N/A'}</TableCell>
                                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" onClick={() => router.push(`/lead/${item.leadId}?uploadId=${item.funnelId}`)} className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg">
                                                            <Eye className="mr-2 h-4 w-4" /> Detalhes
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow className="hover:bg-transparent">
                                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">Nenhum envio encontrado para o funil ou filtros aplicados.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="analysis" className="flex-1 flex flex-col mt-4">
                    {isLoading ? renderLoading() : (
                        <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
                            <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                                <CardTitle className="text-xl text-slate-100">Histórico de Análises de Duplicidade</CardTitle>
                                <CardDescription className="text-slate-400 mt-1">Cada item representa uma execução da análise de duplicidade em todos os seus funis.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {analysisReports.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full">
                                        {analysisReports.map(report => (
                                            <AccordionItem key={report.id} value={report.id} className="border-white/10 mb-2 last:mb-0 rounded-xl overflow-hidden bg-[#0A0A12]/50 data-[state=open]:bg-white/5 transition-colors">
                                                <AccordionTrigger className="hover:no-underline hover:bg-white/[0.02] px-4 py-4 rounded-xl">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                                                                <Bot className="w-5 h-5 text-violet-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-left text-slate-200">
                                                                    Análise de {report.createdAt ? format(new Date(report.createdAt.seconds * 1000), "dd/MM/yyyy 'às' HH:mm") : 'Iniciando...'}
                                                                </p>
                                                                <p className="text-sm text-slate-500 font-normal text-left">{report.summary?.totalIgnored || 0} leads ignorados, {report.summary?.totalCreated || 0} novas abordagens.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {getStatusBadge(report.status)}
                                                            <div className="text-sm text-slate-500 hidden sm:block bg-black/40 px-3 py-1 rounded-full border border-white/5">{report.summary?.funnelsProcessed || 0} funis processados</div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4">
                                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 mt-2 shadow-inner">
                                                        {report.details?.length > 0 ? report.details.map((detail: any) => (
                                                            <div key={detail.funnelId} className="text-sm text-slate-300 flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                                <span className="font-semibold text-slate-200">{detail.funnelName}</span>
                                                                <span className="text-slate-400"><span className="text-orange-400 font-medium">{detail.duplicatesIgnored}</span> ignorados, <span className="text-emerald-400 font-medium">{detail.newPlanCreatedFor}</span> novas abordagens.</span>
                                                            </div>
                                                        )) : (
                                                            <p className="text-sm text-slate-500 italic">
                                                                {report.status === 'Running' ? 'A análise está em andamento. Os detalhes aparecerão em breve...' : 'Nenhum detalhe disponível para esta execução.'}
                                                            </p>
                                                        )}
                                                        {report.error && (
                                                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                                <p className="text-sm font-semibold text-destructive">Ocorreu um erro:</p>
                                                                <p className="text-xs text-destructive/80">{report.error}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center p-12 bg-black/20 rounded-xl border border-white/5 border-dashed mt-4">
                                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-300">Nenhum relatório de análise encontrado.</p>
                                        <p className="text-sm mt-2 text-slate-500 max-w-sm mx-auto">Execute uma "Análise de Duplicidade" no Dashboard para gerar um relatório automático baseando-se nos seus funis.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </main>
    );
}
