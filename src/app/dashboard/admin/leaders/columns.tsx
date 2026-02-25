'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Vote, Users2, Copy, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { AppUser } from '@/types/user';
import { useToast } from "@/components/ui/use-toast";
import { LeaderDeleteAction } from './_components/LeaderDeleteAction';

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

const PhoneCell = ({ phone }: { phone?: string }) => {
  const { toast } = useToast();

  if (!phone) return <span className="text-muted-foreground text-sm">—</span>;

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(phone);
    toast({ title: "Copiado", description: "Telefone copiado para a área de transferência." });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    const numbers = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${numbers}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-sm">{phone}</span>
      <div className="flex -space-x-1 opacity-60 hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleCopyPhone} title="Copiar Telefone">
          <Copy className="h-3.5 w-3.5 text-slate-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleWhatsApp} title="Abrir no WhatsApp">
          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
        </Button>
      </div>
    </div>
  );
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
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => <PhoneCell phone={row.original.phone} />,
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
          <LeaderDeleteAction leaderId={leaderId} leaderName={leader.name || 'Líder Desconhecido'} />
        </div>
      );
    },
  },
];
