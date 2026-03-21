

// src/components/ai-outreach-panel.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, ChevronRight, FileQuestion, CheckCircle, XCircle, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateOutreachList } from '@/ai/flows/generate-outreach-list-flow';
import type { Lead, OutreachItem } from '@/types/ai-types';
import { saveOutreachPlan, updateLeadsStatus, addLeadToFunnel, saveFunnelPrompt, getQualifiableLeads } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from './ui/textarea';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

const availableModels = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-2.0-flash',
];

const defaultPromptText = `
---

# 📌 Tarefa: Gerar Plano de Abordagem Personalizado

Você é um **copywriter de vendas experiente**, especialista em criar mensagens de prospecção para **WhatsApp**.
Sua missão é analisar uma lista de leads e, para cada um, gerar uma mensagem **curta, personalizada e de alto impacto**, junto com os dados necessários para a automação.

---

## 🎯 Regras de Ouro

1.  **Mantenha os Dados:** Para cada lead, você DEVE retornar o \`leadId\`, \`leadName\` e \`phone\` exatamente como foram fornecidos na entrada.
2.  **Personalização da Mensagem:** Use o nome da empresa (\`{{title}}\`) ou o nome do responsável (\`{{name}}\`) para criar laços na mensagem.
3.  **Tom de Voz:** Mantenha um tom próximo, consultivo e prático.
4.  **CTA Forte:** Sempre termine com uma pergunta ou um convite claro para a próxima ação.
5.  **Status Padrão:** O campo \`status\` deve ser sempre "Pendente".

---

## 🚀 Estrutura de Saída Obrigatória

Para cada lead no JSON de entrada, você deve gerar um objeto correspondente no array de saída, seguindo rigorosamente esta estrutura:

\`\`\`json
{
  "leadId": "o_id_original_do_lead",
  "leadName": "O nome ou título do lead",
  "phone": "o_telefone_original_do_lead",
  "suggestedMessage": "Sua mensagem de prospecção personalizada aqui...",
  "status": "Pendente"
}
\`\`\`

---

## ✍️ Exemplos de Mensagens de Sucesso (Use como inspiração)

**Para um Restaurante:**
"Oi, [Nome do Restaurante]! Já imaginou ter um atendente virtual no WhatsApp para anotar pedidos 24h por dia? Queria te mostrar como isso pode aumentar seu faturamento. Tem um minuto?"

**Para uma Clínica:**
"Olá, [Nome da Clínica]! Muitos pacientes tentam agendar horários fora do expediente, né? Com automação, seu WhatsApp pode agendar e confirmar tudo sozinho. Quer ver como funciona?"

---

## ✅ Sua Tarefa Agora

Analise a lista de leads no JSON abaixo. Para cada lead, gere um objeto no formato de saída especificado, incluindo o \`leadId\`, \`leadName\`, \`phone\`, a \`suggestedMessage\` que você criar, e o \`status\` como "Pendente".

\`\`\`json
{{{json leads}}}
\`\`\`

---
`;

interface AIOutreachPanelProps {
    uploadId: string | null;
    onPlanSaved: () => void;
}

type LogEntry = {
    type: 'success' | 'error' | 'info';
    message: string;
    details?: any;
}

export function AIOutreachPanel({ uploadId, onPlanSaved }: AIOutreachPanelProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [progress, setProgress] = useState(0);
    const [executionLog, setExecutionLog] = useState<LogEntry[]>([]);
    const [finalPlan, setFinalPlan] = useState<OutreachItem[] | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]);
    const [customPrompt, setCustomPrompt] = useState(defaultPromptText);
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [qualifiableLeads, setQualifiableLeads] = useState<Lead[]>([]);


    useEffect(() => {
        const fetchQualifiableLeads = async () => {
            if (uploadId && user) {
                try {
                    const leads = await getQualifiableLeads(uploadId, user.uid);
                    setQualifiableLeads(leads);
                } catch (error) {
                    console.error("Failed to fetch qualifiable leads:", error);
                    setQualifiableLeads([]);
                }
            } else {
                setQualifiableLeads([]);
            }
        };
        fetchQualifiableLeads();
    }, [uploadId, user, onPlanSaved]);

    const fetchCustomPrompt = useCallback(async () => {
        if (uploadId) {
            try {
                const funnelDocRef = doc(db, 'uploads', uploadId);
                const docSnap = await getDoc(funnelDocRef);
                if (docSnap.exists() && docSnap.data().customPrompt) {
                    setCustomPrompt(docSnap.data().customPrompt);
                } else {
                    setCustomPrompt(defaultPromptText);
                }
            } catch (error) {
                console.error("Error fetching custom prompt:", error);
                setCustomPrompt(defaultPromptText);
            }
        } else {
            setCustomPrompt(defaultPromptText);
        }
    }, [uploadId]);

    useEffect(() => {
        fetchCustomPrompt();
    }, [fetchCustomPrompt]);


    const handleSavePrompt = async () => {
        if (!uploadId) {
            toast({ title: 'Ação Necessária', description: 'Por favor, selecione um funil específico para salvar um prompt.', variant: 'destructive' });
            return;
        }
        setIsSavingPrompt(true);
        try {
            await saveFunnelPrompt(uploadId, customPrompt);
            toast({ title: "Sucesso!", description: "O prompt personalizado foi salvo para este funil." });
        } catch (e: any) {
            toast({ title: "Erro ao Salvar", description: e.message || "Não foi possível salvar o prompt.", variant: "destructive" });
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const handleQualifyLeads = async () => {
        if (!user) {
            toast({ title: 'Autenticação Necessária', description: 'Você precisa estar logado para executar esta ação.' });
            return;
        }
        if (qualifiableLeads.length === 0) {
            toast({ title: 'Nenhum lead a qualificar', description: 'Não há leads com status "Novo" para qualificar.' });
            return;
        }
        if (!uploadId) {
            toast({ title: 'Ação Necessária', description: 'Por favor, selecione um funil específico para gerar um plano.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setExecutionLog([]);
        setFinalPlan(null);
        setProgress(0);

        const LEADS_TO_PROCESS_LIMIT = 50;
        const leadsForThisRun = qualifiableLeads.slice(0, LEADS_TO_PROCESS_LIMIT);

        // Filter out leads without phone numbers *before* sending to AI
        const leadsWithPhone = leadsForThisRun.filter(lead => lead.phone && lead.phone.trim() !== '');
        const leadsWithoutPhone = leadsForThisRun.filter(lead => !lead.phone || lead.phone.trim() === '');

        if (leadsWithoutPhone.length > 0) {
            leadsWithoutPhone.forEach(lead => {
                setExecutionLog(prev => [...prev, {
                    type: 'info',
                    message: `Lead '${lead.title || lead.name}' (ID: ${lead.id}) ignorado por não ter telefone.`
                }]);
            });
        }

        if (leadsWithPhone.length === 0) {
            toast({ title: 'Nenhum lead válido', description: 'Nenhum dos leads selecionados possui número de telefone para contato.' });
            setIsLoading(false);
            return;
        }

        const BATCH_SIZE = 5;
        let finalOutreachList: OutreachItem[] = [];

        toast({
            title: `Iniciando Processamento`,
            description: `Analisando ${leadsWithPhone.length} leads em lotes de ${BATCH_SIZE}...`
        });

        for (let i = 0; i < leadsWithPhone.length; i += BATCH_SIZE) {
            const batch = leadsWithPhone.slice(i, i + BATCH_SIZE);
            try {
                const result = await generateOutreachList({
                    leads: batch,
                    model: selectedModel,
                    customPrompt: customPrompt,
                });

                if (result && result.outreachList && result.outreachList.length > 0) {
                    // Ensure all items from AI have the required fields before adding to the list
                    const validatedItems = result.outreachList.filter(item => item.leadId && item.leadName && item.suggestedMessage);
                    finalOutreachList.push(...validatedItems);

                    setExecutionLog(prev => [...prev, {
                        type: 'success',
                        message: `Lote ${i / BATCH_SIZE + 1} processado. ${validatedItems.length} abordagens geradas.`
                    }]);
                } else {
                    setExecutionLog(prev => [...prev, {
                        type: 'error',
                        message: `Lote ${i / BATCH_SIZE + 1} processado, mas a IA não retornou abordagens.`,
                        details: result || 'A IA retornou um resultado vazio ou indefinido.'
                    }]);
                }
            } catch (e: any) {
                setExecutionLog(prev => [...prev, {
                    type: 'error',
                    message: `Falha ao processar o lote ${i / BATCH_SIZE + 1}.`,
                    details: e,
                }]);
                toast({ title: "Erro na Geração", description: `Ocorreu um erro: ${e.message}. Verifique o log para mais detalhes.`, variant: "destructive" });
                setIsLoading(false);
                return; // Stop on first error
            }
            setProgress(((i + BATCH_SIZE) / leadsWithPhone.length) * 100);
        }

        // After processing all batches
        if (finalOutreachList.length > 0) {
            try {
                await saveOutreachPlan(uploadId, finalOutreachList);
                const processedLeadIds = finalOutreachList.map(item => item.leadId).filter(id => id); // Filter out any undefined IDs
                if (processedLeadIds.length > 0) {
                    await updateLeadsStatus(uploadId, processedLeadIds, 'Em Pesquisa');
                }
                await addLeadToFunnel(uploadId, {
                    title: `Executar plano de abordagem da IA de ${new Date().toLocaleDateString()}`,
                    proximoPasso: `Revisar as ${finalOutreachList.length} abordagens geradas.`,
                    dataProximoPasso: new Date(),
                    statusFunil: 'Em Pesquisa'
                });

                toast({ title: 'Processamento Concluído!', description: `${finalOutreachList.length} leads foram analisados e um novo plano foi salvo.` });
                setFinalPlan(finalOutreachList);
                onPlanSaved();
            } catch (e: any) {
                toast({ title: 'Erro ao Salvar', description: 'O plano foi gerado, mas falhou ao salvar. Verifique o log.', variant: 'destructive' });
                setExecutionLog(prev => [...prev, {
                    type: 'error',
                    message: `Falha ao salvar o plano final.`,
                    details: e,
                }]);
            }
        } else {
            toast({ title: 'Análise Concluída', description: 'Nenhum plano de abordagem gerado. Nenhuma alteração foi feita.' });
        }

        setIsLoading(false);
    };

    const handleViewGeneratedPlan = () => {
        if (!uploadId) {
            toast({ title: 'Ação Necessária', description: 'Por favor, selecione um funil para ver os planos salvos.', variant: 'destructive' });
            return;
        }
        router.push('/dashboard/plans');
    };

    return (
        <Card className="h-full flex flex-col bg-[#12121A]/80 border-white/10 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl text-white">Assistente de Vendas IA</CardTitle>
                </div>
                <CardDescription className="text-slate-400 pt-2">
                    Gere uma abordagem de vendas para até 50 leads com status 'Novo'. A IA irá analisá-los e salvar um plano de ação, movendo-os para 'Em Pesquisa'.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4 pt-4">
                <Tabs defaultValue="generation" className="flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1">
                        <TabsTrigger value="generation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg">Geração</TabsTrigger>
                        <TabsTrigger value="output" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg">Output</TabsTrigger>
                    </TabsList>
                    <TabsContent value="generation" className="flex-grow flex flex-col mt-4">
                        <div className='flex-grow space-y-4'>
                            <div className='space-y-1'>
                                <label className='text-xs font-medium text-slate-400'>Modelo de IA</label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-blue-500 rounded-xl h-10">
                                        <SelectValue placeholder="Selecione um modelo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#12121A] border-white/10 text-white">
                                        {availableModels.map(model => (
                                            <SelectItem key={model} value={model} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                {model.split('/')[1] || model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400">Prompt de Abordagem</label>
                                <Textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    className="font-mono text-xs h-40 bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl p-4"
                                    placeholder="Edite o prompt para a IA..."
                                    disabled={!uploadId}
                                />
                                <div className='flex gap-2 pt-2'>
                                    <Button onClick={handleSavePrompt} disabled={isSavingPrompt || !uploadId} size="sm" variant="outline" className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex-1">
                                        {isSavingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Prompt
                                    </Button>
                                    <Button onClick={() => setCustomPrompt(defaultPromptText)} size="sm" variant="outline" className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5 flex-1">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Carregar Padrão
                                    </Button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <Button onClick={handleQualifyLeads} disabled={isLoading || qualifiableLeads.length === 0 || !uploadId} className='w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] border-0'>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-5 w-5" />
                                    )}
                                    Gerar Abordagens ({qualifiableLeads.length})
                                </Button>
                            </div>
                        </div>
                        {isLoading && (
                            <div className='pt-4 pb-2'>
                                <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                                <p className='text-xs text-center text-blue-400 mt-2 font-medium'>Analisando... {Math.round(progress)}%</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 pt-6 border-t border-white/5 mt-auto">
                            <Button onClick={handleViewGeneratedPlan} disabled={isLoading || !uploadId} variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 w-full justify-between">
                                <span>Ver Planos Salvos</span>
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="output" className="flex-grow flex flex-col mt-4">
                        <ScrollArea className="h-[calc(100vh-30rem)] pr-3 border border-white/10 rounded-xl bg-white/5">
                            <div className="p-4 space-y-2">
                                {executionLog.length === 0 && !isLoading ? (
                                    <div className="flex flex-col items-center justify-center text-center text-slate-500 h-[200px] p-4">
                                        <FileQuestion className="w-10 h-10 mb-3 opacity-50" />
                                        <p className="text-sm">O log de execução aparecerá aqui.</p>
                                    </div>
                                ) : executionLog.map((log, index) => (
                                    <div key={index} className={`p-3 rounded-xl border ${log.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-100' :
                                            log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                                                'bg-blue-500/10 border-blue-500/20 text-blue-100'
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            {log.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />}
                                            {log.type === 'error' && <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />}
                                            {log.type === 'info' && <XCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />}
                                            <p className="text-sm font-medium leading-relaxed">{log.message}</p>
                                        </div>
                                        {log.details && (
                                            <details className="mt-2 ml-7">
                                                <summary className="text-xs cursor-pointer text-slate-400 hover:text-white transition-colors">Detalhes Técnicos</summary>
                                                <pre className="mt-2 w-full whitespace-pre-wrap rounded-lg bg-[#0A0A12] border border-white/10 p-3 text-xs font-mono text-slate-400 overflow-x-auto shadow-inner">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
