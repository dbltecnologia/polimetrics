

// src/components/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getDashboardData, getAllFunnelsData, updateFunnelCampaignStatus, getOutreachPlans, resetFunnelCampaign } from '@/lib/actions';
import { generateOutreachPlansForAllFunnelsAI } from '@/ai/flows/generate-multiple-outreach-flow';
import { checkAndGenerateOutreach } from '@/ai/flows/check-duplicate-outreaches-flow';
import { Loader2, User, DollarSign, Target, Percent, PlayCircle, PauseCircle, Sparkles, ShieldCheck, Zap, ServerCrash, Server, Upload, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { AIOutreachPanel } from '@/components/ai-outreach-panel';
import type { Lead, CampaignStats } from '@/types/ai-types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { WelcomeModal } from '../welcome-modal';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CampaignControlProps {
    funnelId: string;
    currentStatus: string;
    instanceName: string | null;
    hasOutreachPlans: boolean;
    onStatusChange: () => void;
}

const CampaignControl = ({ funnelId, currentStatus, instanceName, hasOutreachPlans, onStatusChange }: CampaignControlProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = async (newStatus: 'ativa' | 'stopped') => {
        setIsUpdating(true);
        try {
            await updateFunnelCampaignStatus(funnelId, newStatus);
            toast({
                title: 'Sucesso!',
                description: `A campanha agora está ${newStatus === 'ativa' ? 'ativa' : 'parada'}.`
            });
            onStatusChange(); // Re-fetch data
            if (newStatus === 'ativa') {
                router.push(`/funnel/${funnelId}`);
            }
        } catch (error: any) {
            toast({
                title: 'Erro ao Alterar Status',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetCampaign = async () => {
        setIsUpdating(true);
        try {
            const result = await resetFunnelCampaign(funnelId);
            if (result.success) {
                toast({ title: 'Campanha Resetada', description: result.message });
                onStatusChange(); // Re-fetch data
            } else {
                toast({ title: 'Erro', description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Erro ao Resetar', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = () => {
        switch (currentStatus.toLowerCase()) {
            case 'ativa':
            case 'running':
            case 'starting':
                return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold tracking-wide shadow-[0_0_10px_rgba(16,185,129,0.2)]">Ativa</Badge>;
            case 'parada':
            case 'stopped':
                return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold tracking-wide">Parada</Badge>;
            case 'concluida':
            case 'completed':
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-wide">Concluída</Badge>;
            case 'failed':
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-bold tracking-wide">Falhou</Badge>;
            default:
                return <Badge className="bg-slate-800/80 text-slate-300 border-slate-600 font-bold tracking-wide shadow-inner">Pendente</Badge>;
        }
    };

    const canStart = !['ativa', 'running', 'starting'].includes(currentStatus.toLowerCase());
    const canStop = ['ativa', 'running', 'starting'].includes(currentStatus.toLowerCase());

    return (
        <>
            <Card className="bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl">
                <CardHeader className='pb-4 border-b border-white/5'>
                    <CardTitle className='text-lg text-white'>Controle da Campanha</CardTitle>
                    <CardDescription className='text-xs text-slate-400'>Inicie, pare e monitore os disparos deste funil.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2 items-start sm:items-center pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-300">Status:</span>
                        {getStatusBadge()}
                        <span className="text-sm font-medium text-slate-500">|</span>
                        <span className="text-sm font-medium text-slate-300">Instância:</span>
                        {instanceName ? (
                            <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                                <Server className="mr-1.5 h-3 w-3" /> {instanceName}
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Não configurada</Badge>
                        )}
                    </div>
                    <div className="flex-grow" />
                    <Button
                        onClick={() => handleUpdateStatus('ativa')}
                        disabled={!canStart || isUpdating || !instanceName || !hasOutreachPlans}
                        size="sm"
                        title={
                            !instanceName ? "Configure uma instância primeiro" :
                                !hasOutreachPlans ? "Crie pelo menos 1 plano de abordagem antes de iniciar" :
                                    ""
                        }
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] border-0"
                    >
                        {isUpdating && currentStatus !== 'ativa' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                        Iniciar Campanha
                    </Button>
                    <Button onClick={() => handleUpdateStatus('stopped')} disabled={!canStop || isUpdating} variant="destructive" size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/40 border-0 hover:text-white">
                        {isUpdating && currentStatus !== 'stopped' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PauseCircle className="mr-2 h-4 w-4" />}
                        Parar Campanha
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-white/10 bg-transparent" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                Resetar Campanha
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#12121A] border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Resetar progresso da campanha?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    Isto fará com que todos os contatos processados ("Enviados" ou "Falharam") voltem a ficar "Pendentes" e a campanha recomece do zero. Tem certeza que deseja fazer isso?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetCampaign} className="bg-red-600 hover:bg-red-500 text-white">
                                    Sim, resetar disparo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={() => router.push(`/funnel/${funnelId}`)} variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                        Ver Detalhes e Logs
                    </Button>
                </CardContent>
            </Card>
        </>
    );
};


const GlobalActions = ({ onActionCompletes }: { onActionCompletes: () => void }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isGeneratingRealPlans, setIsGeneratingRealPlans] = useState(false);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

    const handleGenerateRealPlans = async () => {
        if (!user) return;
        setIsGeneratingRealPlans(true);
        toast({ title: 'Iniciando Geração em Massa...', description: 'A IA está processando todos os seus funis. Isso pode levar alguns minutos.' });
        try {
            const result = await generateOutreachPlansForAllFunnelsAI(user.uid);
            toast({ title: 'Processo Concluído!', description: `${result.totalPlansCreated} planos de abordagem foram criados em ${result.totalFunnelsProcessed} funis.` });
            onActionCompletes();
        } catch (error: any) {
            toast({ title: 'Erro na Geração em Massa', description: error.message, variant: 'destructive' });
        } finally {
            setIsGeneratingRealPlans(false);
        }
    };

    const handleCheckDuplicates = async () => {
        if (!user) return;
        setIsCheckingDuplicates(true);
        toast({
            title: 'Análise de Duplicidade Iniciada...',
            description: 'O processo está rodando em segundo plano. Você pode consultar os resultados na página de Relatórios.',
            duration: 10000,
        });

        checkAndGenerateOutreach(user.uid)
            .then(results => {
                console.log("Background duplicate check completed.", results);
                // O toast de sucesso pode ser confuso, já que o resultado está em outra página.
                // Um aviso de que a tarefa começou já é suficiente.
            })
            .catch(error => {
                console.error("Background duplicate check failed:", error);
                // Informa o usuário se uma análise já está em progresso.
                if (error.message.includes('already in progress')) {
                    toast({
                        title: 'Análise já em Andamento',
                        description: error.message,
                        variant: 'destructive'
                    });
                } else {
                    toast({
                        title: 'Falha na Análise',
                        description: 'Ocorreu um erro ao iniciar a análise em segundo plano.',
                        variant: 'destructive'
                    });
                }
            })
            .finally(() => {
                setIsCheckingDuplicates(false);
            });

        // Redireciona o usuário para a página de relatórios para que ele possa ver o progresso.
        router.push('/analytics?tab=analysis');
    }

    return (
        <Card className="bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader className='pb-4 border-b border-white/5'>
                <CardTitle className='text-lg text-white'>Ações Globais</CardTitle>
                <CardDescription className='text-xs text-slate-400'>Execute ações para todos os seus funis de uma só vez.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleGenerateRealPlans} disabled={isGeneratingRealPlans || isCheckingDuplicates} size="sm" className='w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border-0'>
                    {isGeneratingRealPlans ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Gerar 10 Abordagens/Funil
                </Button>
                <Button onClick={handleCheckDuplicates} disabled={isCheckingDuplicates} size="sm" className='w-full sm:w-auto bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white' variant="outline">
                    {isCheckingDuplicates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4 text-blue-400" />}
                    Analisar Duplicidade
                </Button>
            </CardContent>
        </Card>
    );
};

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const EmptyDashboardState = () => {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full point-events-none" />
            <div className="h-24 w-24 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.2)] backdrop-blur-sm z-10 relative">
                <Upload className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white z-10">Seu Dashboard está Vazio</h2>
            <p className="text-slate-400 max-w-md mb-8 z-10 leading-relaxed">
                Parece que você ainda não possui nenhum Lead ou Funil criado. Para ver métricas e usar a IA, importe sua primeira lista de contatos.
            </p>
            <Button onClick={() => router.push('/import')} size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] z-10 rounded-xl">
                Importar Meus Primeiros Leads
            </Button>
        </div>
    );
};

// This is the new client component that will contain all the logic
export default function DashboardClientView() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [totalLeadsCount, setTotalLeadsCount] = useState(0);
    const [campaignStatus, setCampaignStatus] = useState<string>('stopped');
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [campaignStats, setCampaignStats] = useState<CampaignStats>({ sent: 0, failed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [outreachPlanCount, setOutreachPlanCount] = useState(0);


    const fetchData = useCallback(async (funnelId: string | null) => {
        if (!user) return;

        setIsLoading(true);
        try {
            let data;
            if (funnelId) {
                data = await getDashboardData(funnelId, user.uid, user.role);
                setCampaignStatus(data.campaignStatus || 'stopped');
                // Support both legacy evolutionInstanceName and the new messagingInstanceName
                setInstanceName(data.messagingInstanceName || data.evolutionInstanceName || null);
                setCampaignStats(data.campaignStats || { sent: 0, failed: 0 });
                // Count outreach plans to guard campaign start
                try {
                    const plansResp = await getOutreachPlans(funnelId);
                    const total = plansResp.data?.reduce((acc: number, plan: any) => acc + (plan.planData?.length || 0), 0) || 0;
                    setOutreachPlanCount(total);
                } catch { setOutreachPlanCount(0); }
            } else {
                data = await getAllFunnelsData(user.uid);
                setCampaignStatus('stopped'); // No status for global view
                setInstanceName(null);
                setCampaignStats({ sent: 0, failed: 0 });
            }

            if (data && data.leads && Array.isArray(data.leads.data)) {
                setLeads(data.leads.data);
                setTotalLeadsCount(data.leads.total);
            } else {
                setLeads([]);
                setTotalLeadsCount(0);
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setLeads([]);
            setTotalLeadsCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const checkNewUser = useCallback(async () => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isNewUser) {
            setIsWelcomeModalOpen(true);
            await updateDoc(userDocRef, { isNewUser: false });
        }
    }, [user]);

    const handleStorageChange = useCallback(() => {
        const currentId = sessionStorage.getItem('activeUploadId');
        setActiveUploadId(currentId);
        if (!isAuthLoading && user) {
            fetchData(currentId);
        }
    }, [isAuthLoading, user, fetchData]);


    useEffect(() => {
        const id = sessionStorage.getItem('activeUploadId');
        setActiveUploadId(id);

        if (!isAuthLoading && user) {
            fetchData(id);
            checkNewUser();
        }

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthLoading, user]);


    const stats = useMemo(() => {
        if (!Array.isArray(leads)) {
            return { totalLeads: 0, wonLeads: 0, lostLeads: 0, conversionRate: 0, workedLeads: 0, unworkedLeads: 0 };
        }

        const totalLeads = totalLeadsCount;
        const wonLeads = leads.filter(l => l.statusFunil === 'Ganhamos').length;
        const lostLeads = leads.filter(l => l.statusFunil === 'Perdemos' || l.statusFunil === 'Inválido').length;
        const resolvedLeadsCount = wonLeads + lostLeads;
        const conversionRate = resolvedLeadsCount > 0 ? (wonLeads / resolvedLeadsCount) * 100 : 0;

        const unworkedLeadsCount = leads.filter(l => !l.statusFunil || l.statusFunil === 'Novo' || l.statusFunil === 'Em Pesquisa').length;
        const workedLeadsCount = totalLeads - unworkedLeadsCount;

        return {
            totalLeads,
            wonLeads,
            lostLeads,
            conversionRate,
            workedLeads: workedLeadsCount,
            unworkedLeads: unworkedLeadsCount
        };
    }, [leads, totalLeadsCount]);

    const funnelDistribution = useMemo(() => {
        if (!Array.isArray(leads)) return [];
        const distribution = leads.reduce((acc, lead) => {
            const status = lead.statusFunil || 'Sem Status';
            if (!['Ganhamos', 'Perdemos', 'Inválido'].includes(status)) {
                acc[status] = (acc[status] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }, [leads]);

    const campaignChartData = useMemo(() => {
        if (!activeUploadId) return [];
        return [
            { name: 'Total', value: totalLeadsCount, fill: 'var(--color-total)' },
            { name: 'Enviados', value: campaignStats.sent, fill: 'var(--color-sent)' },
            { name: 'Falhas', value: campaignStats.failed, fill: 'var(--color-failed)' },
        ];
    }, [activeUploadId, totalLeadsCount, campaignStats]);

    const campaignChartConfig = {
        value: { label: 'Leads' },
        total: { label: 'Total', color: 'hsl(var(--chart-1))' },
        sent: { label: 'Enviados', color: 'hsl(var(--chart-2))' },
        failed: { label: 'Falhas', color: 'hsl(var(--destructive))' },
    } as const;


    if (isLoading || isAuthLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const isDashboardEmpty = !activeUploadId && totalLeadsCount === 0 && leads.length === 0;

    return (
        <div className="min-h-screen bg-[#0A0A12] text-slate-50 selection:bg-blue-500/30">
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 relative overflow-hidden h-full z-10">
                {/* Subtle Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full point-events-none z-[-1]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-violet-600/5 blur-[100px] rounded-full point-events-none z-[-1]" />

                {isDashboardEmpty ? (
                    <EmptyDashboardState />
                ) : (
                    <>
                        {activeUploadId ? (
                            <CampaignControl
                                funnelId={activeUploadId}
                                currentStatus={campaignStatus}
                                instanceName={instanceName}
                                hasOutreachPlans={outreachPlanCount > 0}
                                onStatusChange={() => fetchData(activeUploadId)}
                            />
                        ) : (
                            <GlobalActions onActionCompletes={() => fetchData(null)} />
                        )}

                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Total de Leads</CardTitle>
                                    <User className="h-4 w-4 text-blue-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.totalLeads}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Leads Trabalhados</CardTitle>
                                    <PlayCircle className="h-4 w-4 text-violet-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.workedLeads}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Não Trabalhados</CardTitle>
                                    <PauseCircle className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.unworkedLeads}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Leads Ganhos</CardTitle>
                                    <DollarSign className="h-4 w-4 text-green-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.wonLeads}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Leads Perdidos</CardTitle>
                                    <Target className="h-4 w-4 text-red-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.lostLeads}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#12121A]/60 border-white/5 backdrop-blur-md hover:bg-[#12121A]/80 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Conversão</CardTitle>
                                    <Percent className="h-4 w-4 text-amber-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold text-white">{stats.conversionRate.toFixed(1)}%</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="lg:col-span-4 bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white">Desempenho da Campanha</CardTitle>
                                    <CardDescription className="text-slate-400">Resultado dos disparos para o funil ativo.</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    {activeUploadId ? (
                                        <ChartContainer config={campaignChartConfig} className="h-[250px] w-full">
                                            <BarChart accessibilityLayer data={campaignChartData}>
                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    tickFormatter={(value) => value}
                                                    stroke="#94a3b8" /* slate-400 */
                                                    fontSize={12}
                                                />
                                                <YAxis
                                                    stroke="#94a3b8" /* slate-400 */
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `${value}`}
                                                />
                                                <ChartTooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    content={<ChartTooltipContent indicator="dashed" className="bg-[#1E1E2A] border-white/10 text-white" />}
                                                />
                                                <Bar dataKey="value" radius={8} />
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-slate-500 font-medium bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                                            Selecione um funil para ver o desempenho da campanha.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-3 bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white">Saúde do Funil</CardTitle>
                                    <CardDescription className="text-slate-400">Distribuição de leads ativos por etapa.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {funnelDistribution.length > 0 ? (
                                        <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                                            <PieChart>
                                                <ChartTooltipContent nameKey="value" hideLabel />
                                                <Pie data={funnelDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                                    {funnelDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-slate-500 font-medium bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                                            Nenhum lead ativo no funil.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="grid grid-cols-1 pt-4">
                            <AIOutreachPanel uploadId={activeUploadId} onPlanSaved={() => fetchData(activeUploadId)} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
