'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, Users, MessageSquare, Loader2, Activity } from 'lucide-react';
import { triggerPollBatchAction, sendAlignmentBatchAction, triggerMissionBatchAction } from '../actions';

interface VirtualSecretaryManagerProps {
    polls: any[];
    missions: any[];
    bairros: string[];
}

export function VirtualSecretaryManager({ polls, missions, bairros }: VirtualSecretaryManagerProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // Estados para Disparo de Pesquisa
    const [selectedPoll, setSelectedPoll] = useState('');
    const [pollBairro, setPollBairro] = useState('all');

    // Estados para Alinhamento Político
    const [alignmentTopic, setAlignmentTopic] = useState('');
    const [alignmentBairro, setAlignmentBairro] = useState('all');

    // Estados para Missões
    const [selectedMission, setSelectedMission] = useState('');
    const [missionBairro, setMissionBairro] = useState('all');

    async function handleTriggerPoll() {
        if (!selectedPoll) return;
        setLoading(true);
        const res = await triggerPollBatchAction(selectedPoll, { bairro: pollBairro });
        setLoading(false);

        if (res.success) {
            toast({ title: "Sucesso!", description: `Pesquisa enviada para ${res.count} usuários.` });
        } else {
            toast({ title: "Erro", description: res.error, variant: 'destructive' });
        }
    }

    async function handleSendAlignment() {
        if (!alignmentTopic) return;
        setLoading(true);
        const res = await sendAlignmentBatchAction(alignmentTopic, { bairro: alignmentBairro });
        setLoading(false);

        if (res.success) {
            toast({ title: "Sucesso!", description: "Mensagens de alinhamento enviadas." });
            setAlignmentTopic('');
        } else {
            toast({ title: "Erro", description: res.error, variant: 'destructive' });
        }
    }

    async function handleTriggerMission() {
        if (!selectedMission) return;
        setLoading(true);
        const res = await triggerMissionBatchAction(selectedMission, { bairro: missionBairro });
        setLoading(false);

        if (res.success) {
            toast({ title: "Sucesso!", description: `Missão enviada para ${res.count} usuários.` });
        } else {
            toast({ title: "Erro", description: res.error, variant: 'destructive' });
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* CARD: DISPARO DE PESQUISAS */}
            <Card className="border-sky-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-sky-50/50">
                    <CardTitle className="text-lg flex items-center gap-2 text-sky-900">
                        <MessageSquare className="h-5 w-5" /> Pesquisa (WhatsApp)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione a Pesquisa</label>
                        <Select value={selectedPoll} onValueChange={setSelectedPoll}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolha uma enquete" />
                            </SelectTrigger>
                            <SelectContent>
                                {polls.map(poll => (
                                    <SelectItem key={poll.id} value={poll.id}>{poll.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Público</label>
                        <Select value={pollBairro} onValueChange={setPollBairro}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os bairros" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Bairros</SelectItem>
                                {bairros.map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full bg-sky-600 hover:bg-sky-700" 
                        onClick={handleTriggerPoll}
                        disabled={loading || !selectedPoll}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Disparar
                    </Button>
                </CardContent>
            </Card>

            {/* CARD: ALINHAMENTO POLÍTICO */}
            <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-indigo-50/50">
                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                        <Bot className="h-5 w-5" /> Alinhamento (IA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tópico da Semana</label>
                        <Input 
                            placeholder="Ex: Novo plano de saúde..." 
                            value={alignmentTopic}
                            onChange={(e) => setAlignmentTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Público</label>
                        <Select value={alignmentBairro} onValueChange={setAlignmentBairro}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar bairro" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Bairros</SelectItem>
                                {bairros.map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleSendAlignment}
                        disabled={loading || !alignmentTopic}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                        Enviar
                    </Button>
                </CardContent>
            </Card>

            {/* CARD: MISSÕES (GAMIFICAÇÃO) */}
            <Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-emerald-50/50">
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                        <Activity className="h-5 w-5" /> Missão (Game)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione a Missão</label>
                        <Select value={selectedMission} onValueChange={setSelectedMission}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolha uma missão" />
                            </SelectTrigger>
                            <SelectContent>
                                {missions.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Público</label>
                        <Select value={missionBairro} onValueChange={setMissionBairro}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os bairros" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Bairros</SelectItem>
                                {bairros.map(b => (
                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleTriggerMission}
                        disabled={loading || !selectedMission}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                        Lançar Missão
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
