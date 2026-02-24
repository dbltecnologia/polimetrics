'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Vote, Users2 } from 'lucide-react';
import Link from 'next/link';
import type { AppUser } from '@/types/user';

type LeaderRow = AppUser & {
  memberCount?: number;
  votePotential?: number;
  cityName?: string | null;
  status?: string;
};

const roleLabel = (role?: string) => {
  if (role === 'master') return 'Líder Master';
  if (role === 'sub') return 'Líder Subordinado';
  if (role === 'leader' || role === 'lider') return 'Líder';
  return 'Indefinido';
};

export const columns: ColumnDef<LeaderRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const leader = row.original;
      const leaderId = (leader as any).id ?? leader.userId ?? leader.email;
      return (
        <Link href={`/dashboard/admin/leaders/${leaderId}/view`} className="font-medium text-primary hover:underline">
          {leader.name}
        </Link>
      );
    }
  },
  {
    accessorKey: "role",
    header: "Tipo",
    cell: ({ row }) => {
      return roleLabel(row.original.role);
    },
  },
  {
    accessorKey: "cityName",
    header: "Cidade",
    cell: ({ row }) => row.original.cityName || '—',
  },
  {
    accessorKey: "memberCount",
    header: "Apoiadores",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <Users2 className="h-4 w-4 text-primary" />
        {row.original.memberCount ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "votePotential",
    header: "Votos",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2 font-semibold">
        <Vote className="h-4 w-4 text-emerald-700" />
        {(row.original.votePotential ?? 0).toLocaleString('pt-BR')}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || 'ativo';
      const isInactive = status === 'inativo';
      return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isInactive ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {isInactive ? 'Inativo' : 'Ativo'}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return "-";
      // Converte o timestamp do Firestore (se aplicável) para Date
      const date = (createdAt as any).toDate ? (createdAt as any).toDate() : new Date(createdAt as string);
      if (isNaN(date.getTime())) return "Data inválida";
      return new Intl.DateTimeFormat('pt-BR').format(date);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const leader = row.original;
      const leaderId = (leader as any).id ?? leader.userId ?? leader.email;
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/admin/leaders/${leaderId}`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/admin/leaders/${leaderId}/view`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar</span>
            </Link>
          </Button>
        </div>
      );
    },
  },
];
