// src/components/kanban-column.tsx
'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MapPin, Search } from 'lucide-react';
import type { Lead } from '@/types/ai-types';

export type Tag = {
  text: string;
  color: string;
};

export type Column = {
  id: string;
  title: string;
};

export const interactionTypes = ["Nota", "Ligação", "E-mail", "Reunião", "WhatsApp", "Outro"];


interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
  isOverlay?: boolean;
}

export function LeadCard({ lead, onClick, isOverlay }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    const address = lead.address || lead.city;
    if (address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  const displayTitle = lead.title || lead.name || 'Lead sem título';

  const cardContent = (
    <>
      <div className="flex justify-between items-start">
        <p className="font-semibold text-slate-100 flex-grow pr-2">{displayTitle}</p>
        {(lead.address || lead.city) && (
          <button
            onClick={handleMapClick}
            onMouseDown={(e) => e.stopPropagation()}
            className='p-1 rounded-md hover:bg-white/10 flex-shrink-0 transition-colors'
          >
            <MapPin className='w-4 h-4 text-slate-400 hover:text-white' />
          </button>
        )}
      </div>
      {lead.address && <p className="text-xs text-slate-400 mt-1">{lead.address.split(',')[0]}</p>}
      {lead.city && !lead.address && <p className="text-xs text-slate-400 mt-1">{lead.city}</p>}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.filter(tag => tag.text).slice(0, 3).map((tag, index) => (
            <Badge key={`${tag.text}-${index}`} style={{ backgroundColor: tag.color, color: '#fff' }} className="text-xs px-1.5 py-0.5">{tag.text}</Badge>
          ))}
        </div>
      )}
    </>
  );


  if (isOverlay || isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="p-3 bg-blue-900/40 rounded-xl border border-blue-500/50 opacity-90 cursor-grabbing shadow-[0_0_30px_rgba(37,99,235,0.3)] backdrop-blur-xl"
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(lead)}
      className="touch-none bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:ring-1 hover:ring-blue-500/50 transition-all duration-200 cursor-pointer rounded-xl"
    >
      <CardContent className="p-3 text-sm">
        {cardContent}
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  column: Column;
  leads: Lead[];
  searchTerm: string;
  onSearchChange: (status: string, value: string) => void;
  onCardClick: (lead: Lead) => void;
}

export function KanbanColumn({ column, leads, searchTerm, onSearchChange, onCardClick }: KanbanColumnProps) {
  const leadsIds = useMemo(() => leads.map((l) => l.id), [leads]);

  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full h-full flex flex-col"
    >
      <Card className="flex flex-col h-full bg-[#12121A]/60 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="p-3 font-semibold border-b border-white/10 flex flex-col gap-3 bg-white/5">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-slate-200">{column.title}</CardTitle>
            <Badge variant="outline" className="font-mono text-xs bg-[#0A0A12] text-slate-400 border-white/10">{leads.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Procurar lead..."
              className="w-full rounded-xl bg-[#0A0A12]/80 border-white/10 text-slate-200 placeholder:text-slate-600 pl-9 h-9 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => onSearchChange(column.id, e.target.value)}
            />
          </div>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent className="p-3 flex flex-col gap-3">
            <SortableContext items={leadsIds}>
              {leads.map((lead, index) => (
                <LeadCard key={`${lead.id}-${index}`} lead={lead} onClick={onCardClick} />
              ))}
              {leads.length === 0 && (
                <div className="h-24 flex items-center justify-center text-xs text-slate-500 text-center p-4">
                  {searchTerm ? 'Nenhum lead encontrado.' : 'Arraste os leads para esta coluna.'}
                </div>
              )}
            </SortableContext>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
