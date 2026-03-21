// src/components/import-client-view.tsx
"use client";

import { useState, useCallback, useMemo, ChangeEvent, DragEvent, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Upload, FileText, Download, X, Loader2, TableIcon, Eye, MapPin, ArrowUpDown, Database, History, Trash2, Link, LayoutGrid, BarChart3, Sparkles, BrainCircuit, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn, getTagColor } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc, writeBatch, deleteDoc, updateDoc } from "firebase/firestore";
import MD5 from 'crypto-js/md5';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NextLink from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { categorizeLead } from "@/ai/flows/categorize-lead-flow";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth-context";
import { NewLeadForm } from "./new-lead-form";


type ParsedData = Record<string, any>[];
type SortConfig = { key: string; direction: 'ascending' | 'descending' } | null;
type UploadRecord = {
    id: string;
    fileName: string;
    createdAt: { seconds: number; nanoseconds: number; };
    md5: string;
    recordCount?: number;
    ownerId?: string;
    ownerEmail?: string;
};

const funnelStatuses = ["Novo", "Em Pesquisa", "Primeiro Contato", "Em Follow-up", "Reunião Agendada", "Proposta Enviada", "Ganhamos", "Perdemos", "Inválido"];
const defaultFunnelStages = ["Novo", "Em Pesquisa", "Primeiro Contato", "Em Follow-up", "Reunião Agendada", "Proposta Enviada"];


const getStatusColor = (status: string) => {
    switch (status) {
        case "Novo": return "bg-gray-200 text-gray-800";
        case "Em Follow-up": return "bg-blue-200 text-blue-800";
        case "Reunião Agendada": return "bg-yellow-200 text-yellow-800";
        case "Ganhamos": return "bg-green-200 text-green-800";
        case "Perdemos": return "bg-red-200 text-red-800";
        default: return "bg-gray-100 text-gray-600";
    }
}

const headerTranslations: Record<string, string> = {
    id: "ID", name: "Nome", title: "Título", description: "Descrição", value: "Valor", date: "Data", status: "Status", category: "Categoria",
    price: "Preço", quantity: "Quantidade", sku: "SKU", address: "Endereço", street: "Rua", city: "Cidade", state: "Estado", zip: "CEP", zipcode: "CEP",
    phone: "Telefone", email: "E-mail", createdat: "Criado em", updatedat: "Atualizado em", firstname: "Nome", lastname: "Sobrenome",
    product: "Produto", total: "Total", orderid: "ID do Pedido", url: "URL", website: "Site", location: "Localização",
    statusFunil: "Status"
};

const MAIN_DISPLAY_COLUMNS = ['title', 'address', 'statusFunil'];
const EXCLUDED_COLUMNS = ['lat', 'lon', 'latitude', 'longitude', 'proximopasso', 'dataproximopasso'];

const capitalize = (s: string) => {
    if (typeof s !== 'string' || !s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const translateHeader = (header: string) => {
    if (header.toLowerCase() === 'statusfunil') return 'Status';
    return headerTranslations[header.toLowerCase()] || capitalize(header);
}

const renderCellContent = (value: any, key: string): React.ReactNode => {
    if (key === 'statusFunil' && typeof value === 'string') {
        return <Badge variant="outline" className={cn("text-xs", getStatusColor(value))}>{value}</Badge>;
    }
    if (key === 'address' && typeof value === 'string') {
        return value.split(',')[0];
    }
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
        try {
            new URL(value);
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all flex items-center gap-1">
                    <Link className="h-3 w-3" /> <span>Link</span>
                </a>
            );
        } catch (_) { /* Not a valid URL */ }
    }
    if (typeof value === 'object' && value !== null) {
        const lowerCaseKeys = Object.keys(value).map(k => k.toLowerCase());
        if ((lowerCaseKeys.includes('lat') || lowerCaseKeys.includes('latitude')) && (lowerCaseKeys.includes('lon') || lowerCaseKeys.includes('longitude') || lowerCaseKeys.includes('lng'))) {
            return <span className="text-muted-foreground italic">Localização no mapa</span>
        }
        return JSON.stringify(value);
    }
    return String(value);
};

const findLatLng = (data: any): { lat: string | number; lng: string | number } | null => {
    if (!data || typeof data !== 'object') return null;
    const keys = Object.keys(data);
    const latKey = keys.find(k => k.toLowerCase() === 'lat' || k.toLowerCase() === 'latitude');
    const lngKey = keys.find(k => k.toLowerCase() === 'lon' || k.toLowerCase() === 'longitude' || k.toLowerCase() === 'lng');
    if (latKey && lngKey && data[latKey] && data[lngKey]) return { lat: data[latKey], lng: data[lngKey] };
    for (const key of keys) {
        if (typeof data[key] === 'object' && data[key] !== null) {
            const nested = findLatLng(data[key]);
            if (nested) return nested;
        }
    }
    return null;
}

const setActiveUploadInSession = (uploadId: string | null, funnelName?: string | null) => {
    if (typeof window !== 'undefined') {
        if (uploadId) {
            sessionStorage.setItem('activeUploadId', uploadId);
            if (funnelName) {
                sessionStorage.setItem('activeFunnelName', funnelName);
            }
        } else {
            sessionStorage.removeItem('activeUploadId');
            sessionStorage.removeItem('activeFunnelName');
        }
        window.dispatchEvent(new Event('storage'));
    }
};

const availableModels = [
    'googleai/gemini-2.5-flash-image-preview',
    'gemini-pro',
];

export function ImportClientView() {
    const [data, setData] = useState<ParsedData | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [isHistoryUploadsModalOpen, setIsHistoryUploadsModalOpen] = useState(false);
    const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentMd5, setCurrentMd5] = useState<string | null>(null);
    const [uploadsList, setUploadsList] = useState<UploadRecord[]>([]);
    const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

    const [isCategorizing, setIsCategorizing] = useState(false);
    const [categorizationProgress, setCategorizationProgress] = useState(0);
    const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]);

    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchUploads = useCallback(async () => {
        if (!user) return;
        try {
            let uploadsQuery;
            if (user.role === 'admin') {
                uploadsQuery = query(collection(db, "uploads"), orderBy("createdAt", "desc"));
            } else {
                uploadsQuery = query(collection(db, "uploads"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
            }

            const querySnapshot = await getDocs(uploadsQuery);
            const uploads: UploadRecord[] = [];
            querySnapshot.forEach((doc) => {
                uploads.push({ id: doc.id, ...doc.data() } as UploadRecord);
            });
            setUploadsList(uploads);
        } catch (err) {
            console.error("Erro ao buscar uploads: ", err);
            toast({ title: "Erro ao carregar histórico", description: "Não foi possível buscar os envios anteriores.", variant: "destructive" });
        }
    }, [toast, user]);

    const handleLoadFromHistory = useCallback(async (uploadId: string) => {
        handleClear(true);
        toast({ title: "Carregando do Histórico..." });
        try {
            const docRef = doc(db, "uploads", uploadId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const historyData = docSnap.data();

                if (user?.role !== 'admin' && historyData.ownerId !== user?.uid) {
                    toast({ title: "Acesso Negado", description: "Você não tem permissão para ver este lote de dados.", variant: "destructive" });
                    return;
                }

                const recordsQuery = query(collection(db, "uploads", uploadId, "records"));
                const recordsSnapshot = await getDocs(recordsQuery);
                const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (records.length === 0) {
                    toast({ title: "Aviso", description: "Nenhum registro encontrado para este envio.", variant: "destructive" });
                }

                setData(records as ParsedData);
                setFileName(historyData.fileName);
                setCurrentMd5(historyData.md5);
                setCurrentUploadId(uploadId);
                setActiveUploadInSession(uploadId, historyData.fileName);

                toast({ title: "Sucesso!", description: `Dados de '${historyData.fileName}' carregados.` });
            } else {
                toast({ title: "Erro", description: "Documento não encontrado no histórico.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error loading from history: ", error);
            toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os dados do histórico.", variant: "destructive" });
        }
    }, [toast, user]);

    useEffect(() => {
        if (user) {
            fetchUploads();
            const savedUploadId = sessionStorage.getItem('activeUploadId');
            if (savedUploadId && !currentUploadId) {
                handleLoadFromHistory(savedUploadId);
            }
        }
    }, [fetchUploads, user, handleLoadFromHistory, currentUploadId]);

    const parseXML = (xmlString: string): { data: ParsedData; error: string | null } => {
        try {
            if (typeof window === 'undefined') return { data: [], error: "A análise só pode ser feita no navegador." };
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            const parserError = xmlDoc.querySelector("parsererror");
            if (parserError) return { data: [], error: `Erro ao analisar XML: ${parserError.textContent || 'Estrutura XML inválida.'}` };
            const root = xmlDoc.documentElement;
            if (!root || root.children.length === 0) return { data: [], error: "O XML está vazio ou não possui nós filhos." };
            const tagCounts: { [key: string]: number } = {};
            for (let i = 0; i < root.children.length; i++) {
                const child = root.children[i];
                if (child.nodeType === 1) { tagCounts[child.tagName] = (tagCounts[child.tagName] || 0) + 1; }
            }
            const itemTagName = Object.keys(tagCounts).reduce((a, b) => (tagCounts[a] > tagCounts[b] ? a : b), '');
            if (!itemTagName) return { data: [], error: "Não foi possível determinar o elemento repetitivo principal no XML." };
            const items = Array.from(xmlDoc.getElementsByTagName(itemTagName));
            if (items.length === 0) return { data: [], error: "Nenhum item encontrado. Verifique a estrutura do XML." };
            const result = items.map(item => {
                const obj: Record<string, any> = { statusFunil: 'Novo' };
                for (const child of Array.from(item.children)) {
                    if (child.nodeType === 1) { obj[child.tagName] = child.textContent; }
                }
                return obj;
            }).filter(obj => Object.keys(obj).length > 1);
            if (result.length === 0) return { data: [], error: "Nenhum dado pôde ser extraído." };
            return { data: result, error: null };
        } catch (e: any) {
            return { data: [], error: e.message || "Ocorreu um erro inesperado durante a análise." };
        }
    };

    const parseJSON = (jsonString: string): { data: ParsedData; error: string | null } => {
        try {
            let parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) parsed = [parsed];
            if (parsed.length > 0 && !parsed.every((item: any) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                return { data: [], error: "Formato JSON inválido. Um array deve conter apenas objetos." };
            }
            const result = parsed.map((item: any) => ({ ...item, statusFunil: 'Novo' }));
            return { data: result, error: null };
        } catch (e: any) {
            return { data: [], error: `JSON inválido: ${e.message}` };
        }
    };

    const handleDeleteFromHistory = async (uploadId: string) => {
        if (!uploadId) return;
        setIsDeleting(true);
        toast({ title: "Excluindo...", description: "Removendo o envio do histórico." });
        try {
            const recordsCollectionRef = collection(db, "uploads", uploadId, "records");
            const recordsSnapshot = await getDocs(recordsCollectionRef);
            const batch = writeBatch(db);
            for (const docSnapshot of recordsSnapshot.docs) { batch.delete(docSnapshot.ref); }
            await batch.commit();
            const uploadDocRef = doc(db, "uploads", uploadId);
            await deleteDoc(uploadDocRef);
            toast({ title: "Sucesso!", description: "O envio foi excluído permanentemente." });

            if (currentUploadId === uploadId) {
                handleClear();
            }

            fetchUploads();

        } catch (error: any) {
            console.error("Erro ao excluir do histórico: ", error);
            toast({ title: "Erro ao Excluir", description: error.message || "Não foi possível remover o envio.", variant: "destructive" });
        } finally { setIsDeleting(false); }
    };

    const handleAutomaticCategorization = async (uploadId: string) => {
        if (!user) return;

        setIsCategorizing(true);
        setCategorizationProgress(0);
        toast({ title: "Iniciando categorização automática...", description: `A IA está analisando os leads com ${selectedModel}.` });

        try {
            const recordsQuery = query(collection(db, "uploads", uploadId, "records"));
            const recordsSnapshot = await getDocs(recordsQuery);
            const leadsToCategorize: any[] = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (leadsToCategorize.length === 0) {
                toast({ title: "Sem leads para categorizar." });
                setIsCategorizing(false);
                return;
            }

            const batchSize = 5;
            for (let i = 0; i < leadsToCategorize.length; i += batchSize) {
                const batchLeads = leadsToCategorize.slice(i, i + batchSize);
                const promises = batchLeads.map(lead =>
                    categorizeLead({ leadData: lead, model: selectedModel, userId: user.uid })
                        .then(result => ({ leadId: lead.id, result }))
                        .catch(error => {
                            console.error(`Error categorizing lead:`, error);
                            throw new Error(`Falha ao categorizar o lead ${lead.title || lead.id}. Causa: ${error.message}`);
                        })
                );

                const results = await Promise.all(promises);

                const firestoreBatch = writeBatch(db);
                for (const { leadId, result } of results) {
                    if (result.categories && result.categories.length > 0) {
                        const newTags = result.categories.map(cat => ({ text: cat, color: getTagColor(cat) }));
                        const leadRef = doc(db, 'uploads', uploadId, 'records', leadId);
                        const originalLead = leadsToCategorize.find(l => l.id === leadId);
                        const existingTags = originalLead?.tags || [];
                        const uniqueNewTags = newTags.filter(nt => !existingTags.some((et: any) => et.text.toLowerCase() === nt.text.toLowerCase()));
                        if (uniqueNewTags.length > 0) {
                            firestoreBatch.update(leadRef, { tags: [...existingTags, ...uniqueNewTags] });
                        }
                    }
                }
                await firestoreBatch.commit();

                setCategorizationProgress(((i + batchSize) / leadsToCategorize.length) * 100);
            }
            await handleLoadFromHistory(uploadId);
            toast({ title: "Categorização Concluída!", description: "Os leads foram enriquecidos com novas tags." });
        } catch (error: any) {
            toast({ title: "Erro na Categorização", description: error.message, variant: "destructive" });
        } finally {
            setIsCategorizing(false);
            setCategorizationProgress(0);
        }
    };


    const handleFileUpload = useCallback(async (file: File) => {
        if (!file) return;
        if (!user) {
            toast({ title: "Erro", description: "Você precisa estar logado para fazer o upload.", variant: "destructive" });
            return;
        }

        handleClear(true); // Clear previous data before loading new file

        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension !== 'xml' && fileExtension !== 'json') {
            setError("Tipo de arquivo inválido. Por favor, envie um arquivo XML ou JSON.");
            return;
        }
        setIsParsing(true);
        setError(null);
        setSortConfig(null);
        setFilter('');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileContent = e.target?.result as string;
            const fileMd5 = MD5(fileContent).toString();

            const q = query(collection(db, "uploads"), where("md5", "==", fileMd5), where("ownerId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingDoc = querySnapshot.docs[0];
                toast({ title: "Arquivo já existe", description: "Dados carregados do banco de dados." });
                await handleLoadFromHistory(existingDoc.id);
                setCurrentMd5(fileMd5);
                setIsParsing(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setCurrentMd5(fileMd5);
            const { data: parsedData, error: parseError } = fileExtension === 'xml' ? parseXML(fileContent) : parseJSON(fileContent);
            if (parseError) {
                setError(parseError); setData(null); setFileName(null); setCurrentMd5(null);
            } else {
                setData(parsedData); setFileName(file.name); toast({ title: "Sucesso", description: "Arquivo analisado com sucesso." });
            }
            setIsParsing(false);
        };
        reader.onerror = () => { setError("Falha ao ler o arquivo."); setIsParsing(false); };
        reader.readAsText(file);
    }, [toast, handleLoadFromHistory, user]);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileUpload(e.dataTransfer.files[0]); }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) { handleFileUpload(e.target.files[0]); }
    };

    const handleClear = (keepSession?: boolean) => {
        setData(null); setFileName(null); setError(null); setFilter(''); setSortConfig(null); setCurrentMd5(null); setCurrentUploadId(null);
        setCityFilter(''); setStatusFilter('');
        if (!keepSession) {
            setActiveUploadInSession(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownload = () => {
        if (!data) return;
        const jsonString = JSON.stringify(data.map(({ id, ...rest }) => rest), null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName?.replace(/\.(xml|json)$/i, '') || 'data'}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Download Iniciado", description: "Seu arquivo JSON está sendo baixado." });
    };

    const handleSendToDB = async () => {
        if (!data || data.length === 0 || !currentMd5) {
            toast({ title: "Nenhum dado para enviar", description: "Por favor, carregue um arquivo primeiro.", variant: "destructive" }); return;
        }
        if (!fileName || fileName.trim() === "") {
            toast({ title: "Nomeie sua importação", description: "Por favor, dê um nome descritivo para seu envio.", variant: "destructive" }); return;
        }
        if (!user) {
            toast({ title: "Erro", description: "Você precisa estar logado para salvar os leads.", variant: "destructive" });
            return;
        }
        setIsSending(true);
        toast({ title: "Enviando dados...", description: "Segmentando e enviando para o banco de dados." });
        try {
            const uploadDocRef = await addDoc(collection(db, "uploads"), {
                fileName,
                md5: currentMd5,
                createdAt: serverTimestamp(),
                recordCount: data.length,
                ownerId: user.uid,
                ownerEmail: user.email,
                stages: defaultFunnelStages,
            });
            const recordsCollectionRef = collection(db, "uploads", uploadDocRef.id, "records");

            // Use a Set to track which leads have been added to a batch
            const batchedLeadIndices = new Set();
            let currentBatch = writeBatch(db);
            let currentBatchSize = 0;

            for (let i = 0; i < data.length; i++) {
                if (batchedLeadIndices.has(i)) continue;

                const newDocRef = doc(recordsCollectionRef); // generate a new doc ref
                currentBatch.set(newDocRef, data[i]);
                batchedLeadIndices.add(i);
                currentBatchSize++;

                if (currentBatchSize === 500) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    currentBatchSize = 0;
                }
            }

            if (currentBatchSize > 0) {
                await currentBatch.commit();
            }

            toast({ title: "Sucesso!", description: "Os dados foram enviados para o banco de dados." });
            await handleAutomaticCategorization(uploadDocRef.id);
            fetchUploads();
            router.refresh();

        } catch (error: any) {
            console.error("Erro ao enviar para o Firestore: ", error);
            toast({ title: "Erro no Envio", description: error.message || "Não foi possível enviar os dados.", variant: "destructive" });
        } finally { setIsSending(false); }
    };

    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const handleOpenLeadDetails = (leadId: string) => {
        if (!currentUploadId) {
            toast({ title: "Erro", description: "Selecione um lote de dados para ver os detalhes.", variant: "destructive" });
            return;
        }
        router.push(`/lead/${leadId}?uploadId=${currentUploadId}`);
    };

    const handleMapClick = (row: Record<string, any>) => {
        const coords = findLatLng(row);
        let url: string;
        if (coords) url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
        else {
            const rowKeys = Object.keys(row);
            const addressKeys = ['address', 'street', 'endereço', 'rua', 'location'];
            const addressKey = rowKeys.find(k => addressKeys.includes(k.toLowerCase()));
            const address = addressKey ? row[addressKey] : Object.values(row).filter(v => typeof v === 'string' || typeof v === 'number').join(', ');
            url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        }
        window.open(url, '_blank');
    };

    const headers = useMemo(() => {
        if (!data || data.length === 0) return [];
        return MAIN_DISPLAY_COLUMNS.filter(h => h in data[0]);
    }, [data]);

    const uniqueCities = useMemo(() => {
        if (!data) return [];
        const cities = new Set(data.map(row => row.city).filter(Boolean));
        return Array.from(cities).sort();
    }, [data]);

    const [cityFilter, setCityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const processedData = useMemo(() => {
        if (!data) return [];
        let filteredData = data;

        if (filter) {
            filteredData = filteredData.filter(row =>
                Object.entries(row).some(([key, value]) =>
                    !EXCLUDED_COLUMNS.includes(key.toLowerCase()) && String(value).toLowerCase().includes(filter.toLowerCase())
                )
            );
        }

        if (statusFilter && statusFilter !== 'all') {
            filteredData = filteredData.filter(row => row.statusFunil === statusFilter);
        }

        if (cityFilter && cityFilter !== 'all') {
            filteredData = filteredData.filter(row => row.city === cityFilter);
        }

        if (sortConfig !== null) {
            return [...filteredData].sort((a, b) => {
                const aValue = a[sortConfig.key]; const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [data, filter, sortConfig, cityFilter, statusFilter]);

    return (
        <TooltipProvider>
            <div className="flex-grow p-4 sm:p-6 lg:p-8 flex flex-col">
                {!data ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 mt-12">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">Envie seu arquivo de dados</h2>
                            <p className="mt-3 text-lg text-slate-400">Arraste e solte um arquivo XML ou JSON, ou clique para selecioná-lo.</p>
                        </div>
                        <Card className={cn("w-full max-w-3xl transition-all duration-300 bg-[#12121A]/60 backdrop-blur-xl border-dashed shadow-2xl rounded-3xl", isDragging ? "border-blue-500 ring-4 ring-blue-500/20 bg-blue-500/5" : "border-white/20")} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                            <CardContent className="p-12 text-center">
                                <input ref={fileInputRef} type="file" accept=".xml,.json" onChange={handleFileChange} className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                                            <Upload className="h-10 w-10 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-medium text-slate-200"><span className="text-blue-500 font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                            <p className="text-sm text-slate-500">Arquivos XML ou JSON suportados</p>
                                        </div>
                                        {isParsing && (<div className="flex items-center text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando seu arquivo...</div>)}
                                    </div>
                                </label>
                            </CardContent>
                        </Card>

                        <div className="pt-6">
                            <Button variant="outline" asChild className="bg-[#0A0A12]/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-12 px-6 shadow-lg backdrop-blur-sm">
                                <a href="/Teste.json" download>
                                    <Download className="mr-2 h-5 w-5" />
                                    Baixar Template JSON
                                </a>
                            </Button>
                        </div>
                        {error && (<Alert variant="destructive"><X className="h-4 w-4" /><AlertTitle>Erro na Análise</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                    </div>
                ) : (
                    <Card className="flex-grow flex flex-col bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl mt-4">
                        <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto flex-grow">
                                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                                        <FileText className="h-8 w-8 text-blue-400 flex-shrink-0" />
                                    </div>
                                    <div className="w-full">
                                        <Input value={fileName || ''} onChange={(e) => setFileName(e.target.value)} placeholder="Dê um nome para esta importação" className="text-2xl font-semibold tracking-tight p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto bg-transparent text-slate-100 placeholder:text-slate-600" />
                                        <CardDescription className="text-slate-400 text-base mt-1">{processedData.length} de {data.length} registros encontrados.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex w-full sm:w-auto items-center gap-3">
                                    <Button variant="outline" onClick={() => setIsNewLeadModalOpen(true)} className="w-full sm:w-auto bg-[#0A0A12]/50 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl h-11">
                                        <PlusCircle className="mr-2 h-4 w-4" />Adicionar Lead
                                    </Button>
                                    <Button variant="outline" onClick={() => handleClear(false)} className="w-full sm:w-auto bg-[#0A0A12]/50 border-white/10 text-slate-200 hover:bg-white/10 hover:text-white rounded-xl h-11">
                                        <Upload className="mr-2 h-4 w-4" />Novo Arquivo
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsHistoryUploadsModalOpen(true)} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-[0_0_15px_rgba(99,102,241,0.3)] rounded-xl h-11">
                                        <History className="mr-2 h-4 w-4" /> Histórico
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                                    <div className="flex flex-grow gap-2">
                                        <Input placeholder="Filtrar por palavra-chave..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl h-11" />
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[180px] bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl h-11">
                                                <SelectValue placeholder="Filtrar por Status" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                                <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Todos os Status</SelectItem>
                                                {funnelStatuses.map(s => <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={cityFilter} onValueChange={setCityFilter}>
                                            <SelectTrigger className="w-[180px] bg-[#0A0A12]/80 border-white/10 text-slate-200 rounded-xl h-11">
                                                <SelectValue placeholder="Filtrar por Cidade" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0A12] border-white/10 shadow-xl rounded-xl">
                                                <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">Todas as Cidades</SelectItem>
                                                {uniqueCities.map(c => <SelectItem key={c} value={c} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-slate-300">{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!currentUploadId && (
                                            <Button onClick={handleSendToDB} variant="outline" disabled={isSending} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 rounded-xl h-11 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                                Salvar Leads
                                            </Button>
                                        )}
                                        {currentUploadId && (
                                            <Button
                                                onClick={() => handleAutomaticCategorization(currentUploadId)}
                                                variant="outline"
                                                disabled={isCategorizing}
                                                className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl h-11 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                            >
                                                {isCategorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                Avaliar Leads
                                            </Button>
                                        )}
                                        <Button onClick={handleDownload} className="bg-transparent border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11"><Download className="mr-2 h-4 w-4" />Baixar JSON</Button>
                                    </div>
                                </div>
                                {isCategorizing && (
                                    <Card className="p-3 bg-secondary/50">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                            <div className="w-full">
                                                <p className="text-sm font-medium">Categorizando leads com IA...</p>
                                                <Progress value={categorizationProgress} className="mt-1" />
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex p-6">
                            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-white/10 bg-[#0A0A12]/50">
                                <Table>
                                    <TableHeader className="bg-white/5 border-b border-white/10">
                                        <TableRow className="hover:bg-transparent border-b-0">
                                            {headers.map((headerKey) => (
                                                <TableHead key={headerKey} className="whitespace-nowrap text-slate-300">
                                                    <Button variant="ghost" onClick={() => handleSort(headerKey)} className="hover:bg-white/10 hover:text-white text-slate-300 font-semibold h-9 px-3 rounded-lg">
                                                        {translateHeader(headerKey)}
                                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[100px] text-right text-slate-300 font-semibold p-4">
                                                <span>Ações</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.map((row, index) => (
                                            <TableRow key={row.id || index} onDoubleClick={() => handleOpenLeadDetails(row.id)} className="cursor-pointer border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                {headers.map((headerKey) => (
                                                    <TableCell key={`${row.id || index}-${headerKey}`} className="whitespace-nowrap max-w-sm truncate text-slate-300">{renderCellContent(row[headerKey], headerKey)}</TableCell>
                                                ))}
                                                <TableCell className="whitespace-nowrap text-right">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenLeadDetails(row.id)} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"><Eye className="h-4 w-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-black/90 border-white/10 text-slate-200"><p>Ver Detalhes</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleMapClick(row); }} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"><MapPin className="h-4 w-4" /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-black/90 border-white/10 text-slate-200"><p>Ver no Mapa</p></TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" className="bg-white/5" />
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* History Uploads Modal */}
            <Dialog open={isHistoryUploadsModalOpen} onOpenChange={setIsHistoryUploadsModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-[#0A0A12] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-slate-100">Histórico de Envios</DialogTitle>
                        <DialogDescription className="text-slate-400"> Selecione um envio anterior para carregar os dados na tabela. </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ScrollArea className="h-[60vh] w-full pr-4">
                            <div className="space-y-2">
                                {uploadsList.length > 0 ? uploadsList.map((upload) => (
                                    <div key={upload.id} className="group/item flex items-center justify-between gap-2 rounded-xl border border-white/5 p-3 hover:bg-white/[0.02] bg-[#12121A]/40 transition-colors">
                                        <button onClick={() => { handleLoadFromHistory(upload.id); setIsHistoryUploadsModalOpen(false); }} className="flex flex-col items-start text-left flex-grow min-w-0">
                                            <span className="font-semibold text-sm truncate w-full text-slate-200 group-hover/item:text-blue-400 transition-colors">{upload.fileName}</span>
                                            <span className="text-xs text-slate-500">
                                                {upload.createdAt ? format(new Date(upload.createdAt.seconds * 1000), "dd/MM/yyyy HH:mm") : ''}
                                                {user?.role === 'admin' && upload.ownerEmail && ` - por ${upload.ownerEmail}`}
                                            </span>
                                        </button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isDeleting} className="h-8 w-8 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 rounded-lg">
                                                    <Trash2 className="h-4 w-4 cursor-pointer text-red-500/70 hover:text-red-400" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-[#12121A] border-white/10 text-slate-200">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-slate-100">Você tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400"> Esta ação não pode ser desfeita. Isso excluirá permanentemente o envio e todos os seus registros do banco de dados. </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteFromHistory(upload.id)} disabled={isDeleting} className="bg-red-600 hover:bg-red-500 text-white rounded-xl">
                                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )) : (<div className="p-4 text-center text-sm text-slate-500">Nenhum envio encontrado.</div>)}
                            </div>
                            <ScrollBar orientation="vertical" className="bg-white/5" />
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Lead Modal */}
            <Dialog open={isNewLeadModalOpen} onOpenChange={setIsNewLeadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Lead Manualmente</DialogTitle>
                        <DialogDescription>
                            Insira as informações do novo lead. Ele será adicionado ao funil ativo: <span className="font-bold">{fileName || "Nenhum"}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <NewLeadForm
                        funnelId={currentUploadId}
                        onSuccess={() => {
                            setIsNewLeadModalOpen(false);
                            if (currentUploadId) {
                                handleLoadFromHistory(currentUploadId);
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
