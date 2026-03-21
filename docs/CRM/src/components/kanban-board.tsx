// src/components/kanban-board.tsx
'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';
import { db } from '@/lib/firebase';
import { KanbanColumn, LeadCard } from '@/components/kanban-column';
import type { Lead } from '@/types/ai-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface KanbanBoardProps {
  stages: string[];
  leads: Lead[];
  uploadId: string | null;
  isLoading: boolean;
  onLeadsChange: (leads: Lead[]) => void;
  onLeadClick: (lead: Lead) => void;
}

const lossReasons = [
  "Preço",
  "Concorrência",
  "Timing (não era o momento certo)",
  "Sem Contato (não respondeu)",
  "Sem Interesse (não qualificado)",
  "Funcionalidades Faltantes",
  "Outro (detalhar na nota)",
];

export function KanbanBoard({ stages, leads: initialLeads, uploadId, isLoading, onLeadsChange, onLeadClick }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const router = useRouter();

  const [moveData, setMoveData] = useState<{
    lead: Lead;
    fromStatus: string;
    toStatus: string;
  } | null>(null);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const columns = useMemo(() => {
    return stages.map(status => ({
      id: status,
      title: status,
    }));
  }, [stages]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    columns.forEach(col => {
      grouped[col.id] = [];
    });

    leads.forEach(lead => {
      if (lead.statusFunil && Object.prototype.hasOwnProperty.call(grouped, lead.statusFunil)) {
        const searchTerm = searchTerms[lead.statusFunil]?.toLowerCase() || '';
        const title = lead.title?.toLowerCase() || '';
        const name = lead.name?.toLowerCase() || '';
        const address = lead.address?.toLowerCase() || '';
        const city = lead.city?.toLowerCase() || '';

        if (!searchTerm || title.includes(searchTerm) || name.includes(searchTerm) || address.includes(searchTerm) || city.includes(searchTerm)) {
          grouped[lead.statusFunil].push(lead);
        }
      }
    });
    return grouped;
  }, [leads, columns, searchTerms]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );


  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Lead') {
      setActiveLead(event.active.data.current.lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
    if (active.id === over.id) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    if (!isActiveALead) return;

    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverALead = over.data.current?.type === 'Lead';

    if (!isOverAColumn && !isOverALead) return;

    const fromStatus = active.data.current?.lead.statusFunil;
    const toStatus = isOverAColumn ? over.id : over.data.current?.lead.statusFunil;

    if (fromStatus === toStatus) {
      const newLeads = [...leads];
      const activeIndex = newLeads.findIndex((l) => l.id === active.id);
      const overIndex = newLeads.findIndex((l) => l.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const movedLeads = arrayMove(newLeads, activeIndex, overIndex);
        setLeads(movedLeads);
        onLeadsChange(movedLeads);
      }
      return;
    }
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const fromStatus = active.data.current?.lead.statusFunil;

    let toStatus: string | undefined;

    if (over.data.current?.type === 'Column') {
      toStatus = over.id as string;
    } else if (over.data.current?.type === 'Lead') {
      toStatus = over.data.current.lead.statusFunil as string;
    }

    if (!toStatus || fromStatus === toStatus) {
      return;
    }

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove) return;

    setMoveData({ lead: leadToMove, fromStatus, toStatus });
    setShowNoteModal(true);
  };

  const handleConfirmMove = async () => {
    const { lead, toStatus, fromStatus } = moveData || {};
    if (!lead || !toStatus || !fromStatus) return;

    const isLosing = toStatus === 'Perdemos' || toStatus === 'Inválido';
    const isWinning = toStatus === 'Ganhamos';
    const requiresNote = isLosing || isWinning;

    if (requiresNote && !note.trim()) {
      toast({ title: 'Observação necessária', description: 'Por favor, adicione uma nota para esta mudança de status.', variant: 'destructive' });
      return;
    };

    if (isLosing && !lossReason) {
      toast({ title: 'Motivo necessário', description: 'Por favor, selecione um motivo para a perda.', variant: 'destructive' });
      return;
    }

    setIsUpdating(true);

    try {
      const leadDocRef = doc(db, 'uploads', lead.uploadId, 'records', lead.id);

      const updatePayload: { statusFunil: string; motivoPerda?: string } = { statusFunil: toStatus };
      if (isLosing) {
        updatePayload.motivoPerda = lossReason;
      }

      await updateDoc(leadDocRef, updatePayload);

      let interactionNote = `Status alterado de "${fromStatus}" para "${toStatus}".`;
      if (note.trim()) {
        interactionNote += `\nObservação: ${note}`;
      }

      if (isLosing) {
        interactionNote = `Motivo da Perda: ${lossReason}.\n` + interactionNote;
      }

      const interactionsRef = collection(db, "uploads", lead.uploadId, "records", lead.id, "interacoes");
      await addDoc(interactionsRef, {
        tipoInteracao: 'Mudança de Status',
        resumoInteracao: interactionNote,
        dataInteracao: serverTimestamp(),
        userId: 'system',
        userName: 'Sistema'
      });

      const updatedLeads = leads.map(l =>
        l.id === lead.id ? { ...l, ...updatePayload } : l
      );
      setLeads(updatedLeads);
      onLeadsChange(updatedLeads);

      toast({ title: 'Sucesso!', description: 'Lead movido e interação registrada.' });

    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o lead.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setNote('');
      setLossReason('');
      setShowNoteModal(false);
      setMoveData(null);
    }
  };

  const handleCancelMove = () => {
    setShowNoteModal(false);
    setNote('');
    setLossReason('');
    setMoveData(null);
  };

  const handleSearchChange = (status: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [status]: value }));
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!uploadId) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-white">Nenhum lote de dados selecionado</h2>
        <p className="text-slate-400 mb-4">
          Por favor, vá para a página de importação, carregue um arquivo ou selecione um do histórico para ver o funil.
        </p>
        <NextLink href="/import" passHref>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.4)]">Ir para Importação</Button>
        </NextLink>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="h-full w-full">
          <div className="grid grid-flow-col auto-cols-[320px] gap-4 h-full">
            <SortableContext items={columns.map(c => c.id)}>
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  leads={leadsByStatus[col.id] || []}
                  searchTerm={searchTerms[col.id] || ''}
                  onSearchChange={handleSearchChange}
                  onCardClick={onLeadClick}
                />
              ))}
            </SortableContext>
          </div>
        </div>

        {createPortal(
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} isOverlay />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <Dialog open={showNoteModal} onOpenChange={(open) => !open && handleCancelMove()}>
        <DialogContent className="bg-[#12121A] border-white/10 text-slate-200 shadow-2xl backdrop-blur-xl sm:rounded-2xl" onEscapeKeyDown={(e) => { e.preventDefault(); handleCancelMove(); }} onPointerDownOutside={(e) => { e.preventDefault(); handleCancelMove(); }}>
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Observação</DialogTitle>
            <DialogDescription className="text-slate-400">
              Você está movendo o lead <span className='font-bold text-white'>{moveData?.lead.title || moveData?.lead.name}</span> para <span className='font-bold text-blue-400'>{moveData?.toStatus}</span>. Adicione uma nota sobre esta mudança.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {(moveData?.toStatus === 'Perdemos' || moveData?.toStatus === 'Inválido') && (
              <div className='space-y-1'>
                <Label htmlFor="loss-reason" className="text-slate-300">Motivo da Perda/Invalidade</Label>
                <Select onValueChange={setLossReason} value={lossReason}>
                  <SelectTrigger id="loss-reason" className="bg-white/5 border-white/10 text-white focus:ring-blue-500 rounded-xl h-10">
                    <SelectValue placeholder="Selecione um motivo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A12] border-white/10 text-white">
                    {lossReasons.map(reason => (
                      <SelectItem key={reason} value={reason} className="focus:bg-white/10 focus:text-white cursor-pointer">{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className='space-y-1'>
              <Label htmlFor="note" className="text-slate-300">Observação {(moveData?.toStatus === 'Perdemos' || moveData?.toStatus === 'Inválido' || moveData?.toStatus === 'Ganhamos') ? '(Obrigatório)' : '(Opcional)'}</Label>
              <Textarea
                id="note"
                placeholder="Ex: Cliente demonstrou interesse no produto X..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl p-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelMove} className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleConfirmMove} disabled={isUpdating || ((moveData?.toStatus === 'Perdemos' || moveData?.toStatus === 'Inválido' || moveData?.toStatus === 'Ganhamos') && !note.trim())} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
