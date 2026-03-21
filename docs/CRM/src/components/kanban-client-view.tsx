// src/components/kanban-client-view.tsx
'use client';

import { KanbanBoard } from '@/components/kanban-board';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { ManageStagesModal } from '@/components/manage-stages-modal';
import { useToast } from '@/hooks/use-toast';
import { NewOpportunityForm } from '@/components/new-opportunity-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, BookOpenCheck, GitCompareArrows, LayoutGrid, List, Loader2 } from 'lucide-react';
import type { Lead } from '@/types/ai-types';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { KanbanTable } from './kanban-table';


const defaultFunnelStages = ["Novo", "Em Pesquisa", "Primeiro Contato", "Em Follow-up", "Reunião Agendada", "Proposta Enviada", "Ganhamos", "Perdemos", "Inválido"];

export function KanbanClientView() {
    const [funnelName, setFunnelName] = useState<string>('Funil');
    const [funnelStages, setFunnelStages] = useState<string[]>(defaultFunnelStages);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
    const [isNewOppModalOpen, setIsNewOppModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'kanban' | 'table' | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const fetchFunnelData = useCallback(async (activeUploadId: string | null) => {
        setIsLoading(true);
        setUploadId(activeUploadId);

        if (!activeUploadId || !user) {
            setFunnelStages(defaultFunnelStages);
            setLeads([]);
            setFunnelName('Funil');
            setIsLoading(false);
            return;
        }

        try {
            // Fetch funnel details (name, stages)
            const uploadDocRef = doc(db, 'uploads', activeUploadId);
            const uploadDocSnap = await getDoc(uploadDocRef);

            if (uploadDocSnap.exists()) {
                const uploadData = uploadDocSnap.data();
                if (user.role !== 'admin' && uploadData.ownerId !== user.uid) {
                    toast({ title: "Acesso Negado", variant: "destructive" });
                    setIsLoading(false);
                    return;
                }
                setFunnelName(uploadData.fileName || 'Funil');
                setFunnelStages(uploadData.stages || defaultFunnelStages);
            } else {
                setFunnelStages(defaultFunnelStages);
            }

            // Fetch leads for the funnel (with pagination)
            const recordsRef = collection(db, 'uploads', activeUploadId, 'records');
            const q = query(recordsRef, limit(200)); // Load up to 200 leads initially
            const querySnapshot = await getDocs(q);
            const fetchedLeads: Lead[] = [];
            querySnapshot.forEach((doc) => {
                const leadData = doc.data();
                fetchedLeads.push({
                    id: doc.id,
                    uploadId: activeUploadId,
                    ...leadData,
                    statusFunil: leadData.statusFunil || 'Novo'
                } as Lead);
            });
            setLeads(fetchedLeads);

        } catch (error) {
            console.error("Failed to fetch funnel data:", error);
            toast({ title: "Erro ao buscar dados do funil", variant: "destructive" });
            setLeads([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        const handleStorageChange = () => {
            const currentId = sessionStorage.getItem('activeUploadId');
            fetchFunnelData(currentId);
        };

        handleStorageChange(); // Initial load
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchFunnelData]);

    // Effect to load view mode from localStorage on initial render
    useEffect(() => {
        const savedViewMode = localStorage.getItem('kanbanViewMode');
        if (savedViewMode === 'kanban' || savedViewMode === 'table') {
            setViewMode(savedViewMode);
        } else {
            setViewMode('kanban'); // Set default if nothing is saved
        }
    }, []);

    // Effect to save view mode to localStorage whenever it changes
    useEffect(() => {
        if (viewMode) {
            localStorage.setItem('kanbanViewMode', viewMode);
        }
    }, [viewMode]);


    const handleLeadDoubleClick = (lead: Lead) => {
        if (!lead.uploadId) {
            toast({ title: "Erro", description: "Upload ID não encontrado para este lead.", variant: "destructive" });
            return;
        }
        router.push(`/lead/${lead.id}?uploadId=${lead.uploadId}`);
    };

    const handleStagesUpdated = (newStages: string[]) => {
        setFunnelStages(newStages);
        // Re-fetch all data to ensure consistency after stage update
        fetchFunnelData(uploadId);
    };

    const handleNewLead = (newLead: Lead, keepOpen?: boolean) => {
        setLeads(prevLeads => [...prevLeads, newLead]);
        if (!keepOpen) {
            setIsNewOppModalOpen(false);
        }
    };

    // Render a loader while viewMode is being determined to prevent flashes
    if (viewMode === null) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0A0A12]">
            <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0A0A12]/80 px-4 backdrop-blur-md sm:px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsStagesModalOpen(true)} className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                        Gerenciar Etapas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/plans')} className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                        <BookOpenCheck className="mr-2 h-4 w-4" />
                        Planos de Abordagem
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/compare')} className="bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                        <GitCompareArrows className="mr-2 h-4 w-4" />
                        Comparar Funis
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value: 'kanban' | 'table') => {
                            if (value) setViewMode(value);
                        }}
                        aria-label="Modo de visualização"
                        className="bg-white/5 border border-white/10 rounded-xl p-1"
                    >
                        <ToggleGroupItem value="kanban" aria-label="Visualização Kanban" className="data-[state=on]:bg-blue-600 data-[state=on]:text-white text-slate-400 rounded-lg">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Visualização em Tabela" className="data-[state=on]:bg-blue-600 data-[state=on]:text-white text-slate-400 rounded-lg">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Dialog open={isNewOppModalOpen} onOpenChange={setIsNewOppModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nova Oportunidade
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-white">Criar Nova Oportunidade</DialogTitle>
                            </DialogHeader>
                            <NewOpportunityForm
                                uploadId={uploadId}
                                stages={funnelStages.filter(s => !['Ganhamos', 'Perdemos', 'Inválido'].includes(s))}
                                onSuccess={handleNewLead}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </header>
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
                {viewMode === 'kanban' ? (
                    <KanbanBoard
                        stages={funnelStages}
                        leads={leads}
                        uploadId={uploadId}
                        isLoading={isLoading}
                        onLeadsChange={setLeads}
                        onLeadClick={handleLeadDoubleClick}
                    />
                ) : (
                    <KanbanTable
                        leads={leads}
                        isLoading={isLoading}
                        onRowClick={handleLeadDoubleClick}
                    />
                )}
            </div>
            <ManageStagesModal
                isOpen={isStagesModalOpen}
                onClose={() => setIsStagesModalOpen(false)}
                currentStages={funnelStages}
                uploadId={uploadId}
                onStagesUpdated={handleStagesUpdated}
            />
        </div>
    );
}
