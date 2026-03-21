// src/components/manage-stages-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateFunnelStages } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface ManageStagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStages: string[];
  uploadId: string | null;
  onStagesUpdated: (newStages: string[]) => void;
}

const permanentStages = ["Ganhamos", "Perdemos", "Inválido"];

function SortableItem({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  const isPermanent = permanentStages.includes(id);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: isPermanent });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-2 rounded-md", isPermanent ? 'bg-secondary/50' : 'bg-secondary')}>
      <Button variant="ghost" size="icon" {...attributes} {...listeners} className={cn(isPermanent ? 'cursor-not-allowed text-muted-foreground' : 'cursor-grab')}>
        <GripVertical className="h-4 w-4" />
      </Button>
      <span className="flex-grow">{id}</span>
      {isPermanent ? (
         <Badge variant="outline" className='text-xs'>Permanente</Badge>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => onRemove(id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ManageStagesModal({ isOpen, onClose, currentStages, uploadId, onStagesUpdated }: ManageStagesModalProps) {
  const [editableStages, setEditableStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if(isOpen) {
        setEditableStages(currentStages.filter(s => !permanentStages.includes(s)));
    }
  }, [currentStages, isOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditableStages((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddStage = () => {
    const trimmedName = newStageName.trim();
    if (!trimmedName) {
      toast({ title: 'Nome inválido', description: 'O nome da etapa não pode ser vazio.', variant: 'destructive' });
      return;
    }
    const allStages = [...editableStages, ...permanentStages];
    if (allStages.map(s => s.toLowerCase()).includes(trimmedName.toLowerCase())) {
        toast({ title: 'Etapa duplicada', description: 'Esta etapa já existe no funil.', variant: 'destructive' });
        return;
    }
    setEditableStages([...editableStages, trimmedName]);
    setNewStageName('');
  };

  const handleRemoveStage = (stageToRemove: string) => {
    setEditableStages(editableStages.filter((stage) => stage !== stageToRemove));
  };

  const handleSaveChanges = async () => {
    if (!uploadId) {
      toast({ title: 'Erro', description: 'ID do funil não encontrado.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const finalStages = [...editableStages, ...permanentStages];
    try {
      await updateFunnelStages(uploadId, finalStages);
      toast({ title: 'Sucesso!', description: 'As etapas do funil foram atualizadas.' });
      onStagesUpdated(finalStages);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao salvar', description: 'Não foi possível atualizar as etapas.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas do Funil</DialogTitle>
          <DialogDescription>
            Adicione, remova e reordene as etapas do seu funil de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Adicionar Nova Etapa</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome da nova etapa..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
              />
              <Button onClick={handleAddStage} size="icon">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Etapas Atuais</h3>
            <ScrollArea className="h-60 border rounded-md p-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={editableStages} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {editableStages.map((stage) => (
                            <SortableItem key={stage} id={stage} onRemove={handleRemoveStage} />
                        ))}
                    </div>
                </SortableContext>
                 <div className="space-y-2 mt-2 pt-2 border-t">
                    {permanentStages.map((stage) => (
                        <SortableItem key={stage} id={stage} onRemove={() => {}} />
                    ))}
                 </div>
              </DndContext>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
