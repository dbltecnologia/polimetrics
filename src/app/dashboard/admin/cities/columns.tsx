'use client';

import { ColumnDef } from '@tanstack/react-table';
import { City } from '@/types/city';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation'; // Importa o useRouter

function CityActionsCell({ row }: { row: any }) {
  const city = row.original;
  const router = useRouter(); // Inicializa o router

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(city.id)}
        >
          Copiar ID da Cidade
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
        {/* Adiciona o onClick para navegar para a página de edição */}
        <DropdownMenuItem onClick={() => router.push(`/dashboard/admin/cities/${city.id}`)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500">Deletar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<City>[] = [
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
    )
  },
  {
    accessorKey: "state",
    header: "Estado",
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;

      if (!createdAt) {
        return <span>-</span>;
      }

      const date = new Date(createdAt as string);

      if (isNaN(date.getTime())) {
        return <span>Data inválida</span>;
      }

      const formattedDate = new Intl.DateTimeFormat('pt-BR').format(date);
      return <span>{formattedDate}</span>;
    },
  },
  {
    id: "actions",
    cell: CityActionsCell,
  },
];
