// src/components/kanban-table.tsx
'use client';

import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Loader2, Search } from 'lucide-react';
import type { Lead } from '@/types/ai-types';
import { getStatusColor, getTagColor } from '@/lib/utils';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface KanbanTableProps {
  leads: Lead[];
  isLoading: boolean;
  onRowClick: (lead: Lead) => void;
}

type SortConfig = { key: keyof Lead; direction: 'ascending' | 'descending' } | null;

export function KanbanTable({ leads, isLoading, onRowClick }: KanbanTableProps) {
  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  
  const filteredAndSortedLeads = useMemo(() => {
    let filteredData = leads;

    if (filter) {
      const lowercasedFilter = filter.toLowerCase();
      filteredData = filteredData.filter(lead => {
        return Object.values(lead).some(value =>
          String(value).toLowerCase().includes(lowercasedFilter)
        );
      });
    }
    
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
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

    return filteredData;
  }, [leads, filter, sortConfig]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const renderHeader = (key: keyof Lead, label: string) => (
    <TableHead>
      <Button variant="ghost" onClick={() => requestSort(key)}>
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div className="h-full flex flex-col gap-4">
       <div className="flex items-center gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filtrar tabela..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-8"
                />
            </div>
        </div>

        <div className="border rounded-md flex-grow">
            <ScrollArea className="h-[calc(100vh-20rem)]">
                <Table>
                <TableHeader>
                    <TableRow>
                    {renderHeader('title', 'Título')}
                    {renderHeader('statusFunil', 'Status')}
                    {renderHeader('value', 'Valor (R$)')}
                    <TableHead>Tags</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : filteredAndSortedLeads.length > 0 ? (
                    filteredAndSortedLeads.map((lead) => (
                        <TableRow key={lead.id} onClick={() => onRowClick(lead)} className="cursor-pointer">
                        <TableCell className="font-medium">{lead.title || lead.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(lead.statusFunil || 'Novo'))}>
                                {lead.statusFunil || 'Novo'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {lead.value ? `R$ ${lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {lead.tags?.slice(0, 3).map(tag => (
                                    <Badge key={tag.text} style={{ backgroundColor: tag.color, color: '#fff' }}>
                                    {tag.text}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum lead encontrado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </ScrollArea>
        </div>
    </div>
  );
}
