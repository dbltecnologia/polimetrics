
"use client"


import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from 'date-fns';

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
];

// Nota: Para city.name e leader.name, o objeto Member precisará ter esses dados pré-populados
// ou você terá que fazer buscas adicionais. Uma view na página do cliente é mais simples.
