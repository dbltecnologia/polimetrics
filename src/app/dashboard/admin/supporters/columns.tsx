
"use client"

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { MemberDeleteAction } from '@/components/admin/members/MemberDeleteAction';

const formatDateOfBirth = (dateString: string) => {
    try {
        if (dateString.includes('/')) { // DD/MM/YYYY
            const [day, month] = dateString.split('/');
            return `${day}/${month}`;
        }
        if (dateString.includes('-')) { // YYYY-MM-DD
            const date = parseISO(dateString);
            return format(date, 'dd/MM');
        }
        return 'Inválida';
    } catch (error) {
        return 'Inválida';
    }
}

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: "Nome",
    },
    {
        accessorKey: "cityName",
        header: "Cidade",
        cell: ({ row }) => row.original.cityName || 'N/A',
    },
    {
        accessorKey: "bairro",
        header: "Bairro",
    },
    {
        accessorKey: "leaderName",
        header: "Líder Responsável",
        cell: ({ row }) => row.original.leaderName || 'N/A',
    },
    {
        accessorKey: "social",
        header: "WhatsApp",
        cell: ({ row }) => {
            const phone = row.getValue("social");
            return phone ? <a href={`https://wa.me/${phone}`} target="_blank" className="text-blue-500 hover:underline">Contatar</a> : "N/A";
        },
    },
    {
        accessorKey: "nascimento",
        header: "Aniversário",
        cell: ({ row }) => formatDateOfBirth(row.getValue("nascimento")),
    },
    {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" asChild className="h-8 w-8">
                    <Link href={`/dashboard/admin/members/${row.original.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Editar</span>
                    </Link>
                </Button>
                <MemberDeleteAction memberId={row.original.id} memberName={row.original.name || 'Apoiador'} />
            </div>
        ),
    },
];
