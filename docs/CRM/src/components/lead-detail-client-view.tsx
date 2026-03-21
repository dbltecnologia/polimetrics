
// src/components/lead-detail-client-view.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, History, Loader2, Link as LinkIcon, MapPin, PlusCircle, Tag, X as XIcon, Check, ChevronsUpDown, BrainCircuit, Sparkles, Copy } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getTagColor, cn } from '@/lib/utils';
import NextLink from 'next/link';
import { generateLeadStrategy } from '@/ai/flows/generate-lead-strategy-flow';
import type { GenerateLeadStrategyOutput } from '@/types/ai-types';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuth } from '@/context/auth-context';


type LeadData = { id: string; tags?: Tag[], [key: string]: any };
type Tag = { text: string; color: string; };
type Interaction = {
    id: string;
    dataInteracao: { seconds: number; nanoseconds: number; };
    tipoInteracao: string;
    resumoInteracao: string;
    tags?: Tag[];
};

const funnelStatuses = ["Novo", "Em Pesquisa", "Primeiro Contato", "Em Follow-up", "Reunião Agendada", "Proposta Enviada", "Ganhamos", "Perdemos", "Inválido"];
const interactionTypes = ["Ligação", "E-mail", "Reunião", "WhatsApp", "Nota", "Outro"];
const EXCLUDED_COLUMNS_DISPLAY = ['id', 'lat', 'lon', 'latitude', 'longitude', 'proximoPasso', 'dataProximoPasso', 'tags'];

const availableModels = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-2.0-flash',
];

const headerTranslations: Record<string, string> = {
    id: "ID", name: "Nome", title: "Título", description: "Descrição", value: "Valor", date: "Data", status: "Status", category: "Categoria",
    price: "Preço", quantity: "Quantidade", sku: "SKU", address: "Endereço", street: "Rua", city: "Cidade", state: "Estado", zip: "CEP", zipcode: "CEP",
    phone: "Telefone", email: "E-mail", createdat: "Criado em", updatedat: "Atualizado em", firstname: "Nome", lastname: "Sobrenome",
    product: "Produto", total: "Total", orderid: "ID do Pedido", url: "URL", website: "Site", location: "Localização",
    statusFunil: "Status"
};

const capitalize = (s: string) => {
    if (typeof s !== 'string' || !s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const translateHeader = (header: string) => {
    if (header.toLowerCase() === 'statusfunil') return 'Status';
    return headerTranslations[header.toLowerCase()] || capitalize(header);
}

const renderCellContent = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        try {
            new URL(value);
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> <span>Link</span>
                </a>
            );
        } catch (_) { /* Not a valid URL */ }
    }
    if (typeof value === 'object' && value.seconds && value.nanoseconds) {
        return format(new Date(value.seconds * 1000), 'dd/MM/yyyy HH:mm');
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
};

export function LeadDetailClientView() {
    const params = useParams();
    const leadId = params.id as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const uploadId = searchParams.get('uploadId');
    const { toast } = useToast();
    const { user } = useAuth();


    const [lead, setLead] = useState<LeadData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [allSystemTags, setAllSystemTags] = useState<string[]>([]);
    const [hasCopied, setHasCopied] = useState(false);

    // States for inline editing
    const [proximoPassoText, setProximoPassoText] = useState('');
    const [proximoPassoDate, setProximoPassoDate] = useState('');

    // States for adding new interaction/note
    const [newInteractionType, setNewInteractionType] = useState(interactionTypes[0]);
    const [newInteractionSummary, setNewInteractionSummary] = useState('');
    const [isAddingInteraction, setIsAddingInteraction] = useState(false);

    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Combobox states
    const [tagComboboxOpen, setTagComboboxOpen] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // AI Strategy states
    const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
    const [strategy, setStrategy] = useState<GenerateLeadStrategyOutput | null>(null);
    const [strategyModel, setStrategyModel] = useState<string>(availableModels[0]);
    const [strategyError, setStrategyError] = useState<string | null>(null);

    // Saving State feedback
    const [savingStates, setSavingStates] = useState<{ [key: string]: 'saving' | 'saved' }>({});


    const fetchAllTags = useCallback(async () => {
        if (!uploadId) return;
        const tagSet = new Set<string>();
        try {
            const recordsRef = collection(db, 'uploads', uploadId, 'records');
            const recordsSnapshot = await getDocs(recordsRef);
            for (const recordDoc of recordsSnapshot.docs) {
                const recordData = recordDoc.data();
                if (recordData.tags && Array.isArray(recordData.tags)) {
                    recordData.tags.forEach((tag: any) => { // Use 'any' temporarily for safety
                        if (tag && tag.text && typeof tag.text === 'string' && !tagSet.has(tag.text.toLowerCase())) {
                            tagSet.add(tag.text);
                        }
                    });
                }
            }
            setAllSystemTags(Array.from(tagSet).sort());
        } catch (error) {
            console.error("Failed to fetch all system tags:", error);
        }
    }, [uploadId]);


    const fetchLeadData = useCallback(async () => {
        if (!uploadId || !leadId) {
            toast({ title: 'Erro', description: 'ID do lead ou do lote não encontrado.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const leadDocRef = doc(db, 'uploads', uploadId, 'records', leadId);
            const leadSnap = await getDoc(leadDocRef);

            if (leadSnap.exists()) {
                const leadData: any = { id: leadSnap.id, ...leadSnap.data() };
                setLead(leadData);
                setProximoPassoText(leadData.proximoPasso || '');
                setProximoPassoDate(leadData.dataProximoPasso?.seconds ? format(new Date(leadData.dataProximoPasso.seconds * 1000), 'dd/MM/yyyy') : '');

                setNewInteractionSummary('');
                setNewNote('');
            } else {
                toast({ title: 'Erro', description: 'Lead não encontrado.', variant: 'destructive' });
            }
        } catch (error) {
            console.error("Error fetching lead:", error);
            toast({ title: 'Erro de Carregamento', description: 'Não foi possível buscar os dados do lead.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [uploadId, leadId, toast]);

    const fetchInteractions = useCallback(async () => {
        if (!uploadId || !leadId) return;
        try {
            const q = query(collection(db, "uploads", uploadId, "records", leadId, "interacoes"), orderBy("dataInteracao", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedInteractions: Interaction[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction));
            setInteractions(fetchedInteractions);
        } catch (error) {
            console.error("Error fetching interactions: ", error);
            toast({ title: "Erro", description: "Não foi possível carregar o histórico de interações.", variant: "destructive" });
        }
    }, [uploadId, leadId, toast]);

    useEffect(() => {
        fetchLeadData();
        fetchInteractions();
        fetchAllTags();
    }, [fetchLeadData, fetchInteractions, fetchAllTags]);

    const handleUpdateLeadField = async (field: string, value: any) => {
        if (!uploadId || !leadId) return;

        setSavingStates(prev => ({ ...prev, [field]: 'saving' }));

        try {
            const leadDocRef = doc(db, "uploads", uploadId, "records", leadId);
            await updateDoc(leadDocRef, { [field]: value });

            setLead(prev => prev ? { ...prev, [field]: value } : null);
            setSavingStates(prev => ({ ...prev, [field]: 'saved' }));

            setTimeout(() => {
                setSavingStates(prev => {
                    const newStates = { ...prev };
                    delete newStates[field];
                    return newStates;
                });
            }, 2000);

        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            toast({ title: "Erro de Atualização", description: `Não foi possível atualizar o campo ${translateHeader(field)}.`, variant: "destructive" });
            setSavingStates(prev => {
                const newStates = { ...prev };
                delete newStates[field];
                return newStates;
            });
        }
    };

    const handleTagOperation = async (tagText: string, operation: 'add' | 'remove') => {
        if (!lead || !tagText.trim()) return;

        let currentTags = lead.tags || [];
        const lowerCaseTagText = tagText.trim().toLowerCase();
        const trimmedTagText = tagText.trim();

        if (operation === 'add') {
            if (currentTags.some(t => t && t.text && t.text.toLowerCase() === lowerCaseTagText)) {
                toast({ title: "Tag já existe", description: "Esta tag já está associada a este lead.", variant: "default" });
                return;
            }
            const newTag: Tag = { text: trimmedTagText, color: getTagColor(trimmedTagText) };
            currentTags.push(newTag);
        } else { // remove
            currentTags = currentTags.filter(t => t && t.text && t.text.toLowerCase() !== lowerCaseTagText);
        }

        await handleUpdateLeadField('tags', currentTags);

        if (operation === 'add' && !allSystemTags.map(t => t.toLowerCase()).includes(lowerCaseTagText)) {
            fetchAllTags();
        }
        setNewTagName('');
        setTagComboboxOpen(false);
    };


    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const dateString = e.target.value;
        if (!dateString) {
            handleUpdateLeadField('dataProximoPasso', null);
            return;
        }
        const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
            handleUpdateLeadField('dataProximoPasso', parsedDate);
        } else {
            toast({ title: "Data inválida", description: "Por favor, use o formato dd/mm/aaaa.", variant: "destructive" });
        }
    };

    const addInteraction = async (interactionData: Omit<Interaction, 'id' | 'dataInteracao'>) => {
        if (!uploadId || !leadId) return;

        try {
            const newDoc = await addDoc(collection(db, "uploads", uploadId, "records", leadId, "interacoes"), {
                ...interactionData,
                dataInteracao: serverTimestamp()
            });
            fetchInteractions();
            toast({ title: "Sucesso", description: "Interação adicionada." });
            return newDoc.id;
        } catch (error) {
            console.error("Error adding interaction:", error);
            toast({ title: "Erro", description: "Não foi possível adicionar a interação.", variant: "destructive" });
            return null;
        }
    }


    const handleAddInteraction = async () => {
        if (!newInteractionSummary.trim()) {
            toast({ title: 'Campo Obrigatório', description: 'O resumo da interação não pode estar vazio.', variant: 'destructive' });
            return;
        };
        setIsAddingInteraction(true);

        await addInteraction({
            tipoInteracao: newInteractionType,
            resumoInteracao: newInteractionSummary,
        });

        setNewInteractionSummary('');
        setIsAddingInteraction(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toast({ title: 'Campo Obrigatório', description: 'A nota não pode estar vazia.', variant: 'destructive' });
            return;
        }
        setIsAddingNote(true);

        await addInteraction({
            tipoInteracao: 'Nota',
            resumoInteracao: newNote,
        });

        setNewNote('');
        setIsAddingNote(false);
    };

    const handleMapClick = () => {
        if (!lead) return;
        const address = lead.address || lead.city || Object.values(lead).filter(v => typeof v === 'string').join(', ');
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    };

    const handleCopyId = () => {
        if (!leadId) return;
        navigator.clipboard.writeText(leadId);
        setHasCopied(true);
        toast({ title: "ID Copiado!", description: "O ID do lead foi copiado para a área de transferência." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const filteredSystemTags = useMemo(() => {
        const leadTagTexts = new Set((lead?.tags || []).filter(t => t && t.text).map(t => t.text.toLowerCase()));
        return allSystemTags.filter(tag => !leadTagTexts.has(tag.toLowerCase()));
    }, [allSystemTags, lead?.tags]);

    const handleGenerateStrategy = async () => {
        if (!lead || !user) return;
        setIsGeneratingStrategy(true);
        setStrategy(null);
        setStrategyError(null);
        try {
            const interactionHistoryForAI = interactions.map(i => ({
                ...i,
                dataInteracao: i.dataInteracao ? new Date(i.dataInteracao.seconds * 1000).toISOString() : new Date().toISOString()
            }));

            const result = await generateLeadStrategy({
                lead: lead,
                interactionHistory: interactionHistoryForAI,
                model: strategyModel,
                userId: user.uid
            });
            setStrategy(result);
        } catch (error: any) {
            console.error("Error generating strategy:", error);
            setStrategyError(error.message || "Ocorreu um erro desconhecido.");
            toast({ title: "Erro de IA", description: error.message, variant: 'destructive' });
        } finally {
            setIsGeneratingStrategy(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!lead) {
        return <div className="flex h-screen items-center justify-center">Lead não encontrado.</div>;
    }

    return (
        <div className="flex-grow p-4 sm:p-6 lg:p-8">
            <div className="mb-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a lista
                </Button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Side - Details */}
                <Card className="xl:col-span-2">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Informações Gerais</CardTitle>
                            <CardDescription>Todos os dados do lead.</CardDescription>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline">ID: {leadId}</Badge>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopyId}>
                                    {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleMapClick}>
                            <MapPin className='w-5 h-5 text-muted-foreground' />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[65vh] pr-4">
                            <div className="space-y-4">
                                {Object.entries(lead).map(([key, value]) => {
                                    if (EXCLUDED_COLUMNS_DISPLAY.includes(key.toLowerCase())) return null;
                                    return (
                                        <div className="grid grid-cols-[1fr_2fr] items-start gap-4" key={key}>
                                            <span className="font-semibold text-right text-sm">{translateHeader(key)}</span>
                                            {key === 'statusFunil' ? (
                                                <Select value={value} onValueChange={(newValue) => handleUpdateLeadField('statusFunil', newValue)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{funnelStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="bg-muted p-2 rounded-md text-sm break-words min-h-[36px] flex items-center">{renderCellContent(value, key)}</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Side - CRM */}
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader><CardTitle>Gerenciar Tags</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Tags Atuais</h4>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags && lead.tags.length > 0 ? (
                                        lead.tags.filter(tag => tag && tag.text).map((tag, index) => (
                                            <Badge key={`${tag.text}-${index}`} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }} className="flex items-center gap-1.5 pr-1">
                                                <span>{tag.text}</span>
                                                <button onClick={() => handleTagOperation(tag.text, 'remove')} className="rounded-full hover:bg-black/20">
                                                    <XIcon className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    ) : <p className="text-xs text-muted-foreground">Nenhuma tag.</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Adicionar Tag</h4>
                                <Popover open={tagComboboxOpen} onOpenChange={setTagComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={tagComboboxOpen} className="w-full justify-between">
                                            Adicionar tag...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <div className="p-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Nova tag..."
                                                    value={newTagName}
                                                    onChange={e => setNewTagName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleTagOperation(newTagName, 'add')}
                                                />
                                                <Button size="icon" onClick={() => handleTagOperation(newTagName, 'add')}><PlusCircle className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                        <ScrollArea className="h-48">
                                            <div className="p-2 space-y-1">
                                                {filteredSystemTags.length > 0 ? filteredSystemTags.map(tag => (
                                                    <Button
                                                        key={tag}
                                                        variant="ghost"
                                                        className="w-full justify-start font-normal"
                                                        onClick={() => handleTagOperation(tag, 'add')}
                                                    >
                                                        {tag}
                                                    </Button>
                                                )) : (
                                                    <p className="p-2 text-center text-xs text-muted-foreground">Nenhuma outra tag no sistema.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Próximo Passo</CardTitle>
                                <div className="flex items-center h-5">
                                    {savingStates['proximoPasso'] === 'saving' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                    {savingStates['proximoPasso'] === 'saved' && <span className="flex items-center text-xs text-green-500"><Check className="w-3 h-3 mr-1" /> Salvo</span>}
                                    {savingStates['dataProximoPasso'] === 'saving' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
                                    {savingStates['dataProximoPasso'] === 'saved' && <span className="flex items-center text-xs text-green-500 ml-2"><Check className="w-3 h-3 mr-1" /> Data Salva</span>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea
                                placeholder="Descreva a próxima ação..."
                                value={proximoPassoText}
                                onChange={(e) => setProximoPassoText(e.target.value)}
                                onBlur={(e) => handleUpdateLeadField('proximoPasso', e.target.value)}
                            />
                            <Input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={proximoPassoDate}
                                onChange={(e) => setProximoPassoDate(e.target.value)}
                                onBlur={handleDateBlur}
                                className="w-[240px]"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interações & Histórico</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Interaction Inline */}
                            <div className="space-y-2 p-3 bg-secondary/20 border border-white/5 rounded-xl">
                                <Select value={newInteractionType} onValueChange={setNewInteractionType}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Tipo de interação" /></SelectTrigger>
                                    <SelectContent className="bg-[#0A0A12] border-white/10 text-white">
                                        {interactionTypes.map(t => <SelectItem key={t} value={t} className="focus:bg-white/10 focus:text-white">{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Textarea
                                    placeholder="Resumo da interação ou nova nota..."
                                    value={newInteractionSummary}
                                    onChange={e => setNewInteractionSummary(e.target.value)}
                                    className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl max-h-32"
                                />
                                <Button onClick={handleAddInteraction} disabled={isAddingInteraction} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0">
                                    {isAddingInteraction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Interação
                                </Button>
                            </div>

                            {/* History Feed */}
                            <ScrollArea className="h-[400px] w-full pr-4 mt-4">
                                <div className="space-y-3">
                                    {interactions.length > 0 ? interactions.map(item => (
                                        <div key={item.id} className="text-sm p-3 border border-white/5 bg-white/5 rounded-xl">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-blue-400">{item.tipoInteracao}</span>
                                                <span className="text-xs text-slate-500">{item.dataInteracao ? format(new Date(item.dataInteracao.seconds * 1000), "dd/MM/yy HH:mm") : ''}</span>
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap text-slate-300">{item.resumoInteracao}</p>
                                        </div>
                                    )) : <p className="text-sm text-center text-slate-500 p-4">Nenhuma interação registrada.</p>}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-primary" />
                        <CardTitle>Estrategista de Conta IA</CardTitle>
                    </div>
                    <CardDescription>
                        Gere um plano de ação estratégico com base nos dados e histórico deste lead.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="flex-grow w-full">
                            <label className="text-xs font-medium text-muted-foreground">Modelo de IA</label>
                            <Select value={strategyModel} onValueChange={setStrategyModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableModels.map(model => (
                                        <SelectItem key={model} value={model}>
                                            {model.split('/')[1] || model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateStrategy} disabled={isGeneratingStrategy} className="w-full sm:w-auto self-end">
                            {isGeneratingStrategy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar Estratégia
                        </Button>
                    </div>

                    {strategy ? (
                        <div className="border p-4 rounded-lg bg-secondary/50 space-y-4">
                            <div>
                                <h3 className="font-bold text-lg">{strategy.strategicObjective}</h3>
                                <p className="text-sm text-muted-foreground">Objetivo Estratégico</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold">Plano de Ação:</h4>
                                {strategy.actionPlan.map(step => (
                                    <div key={step.step} className="p-3 border rounded bg-background">
                                        <p className="font-semibold">Passo {step.step}: {step.action} ({step.channel})</p>
                                        <p className="text-sm mt-1 p-2 bg-muted rounded">{step.content}</p>
                                        <p className="text-xs text-muted-foreground italic mt-2">{step.justification}</p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-semibold">Tags Sugeridas:</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {strategy.suggestedTags.map(tag => (
                                        <Badge key={tag} variant="outline" style={{ borderColor: getTagColor(tag) }}>{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : strategyError ? (
                        <Alert variant="destructive">
                            <AlertTitle>Erro ao Gerar Estratégia</AlertTitle>
                            <AlertDescription>{strategyError}</AlertDescription>
                        </Alert>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
