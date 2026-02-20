'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/services/admin/users/getAllUsers';
import { ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { updateUser } from '@/services/admin/users/updateUser';

const UserActions = ({ user }: { user: User }) => {
    const { toast } = useToast();

    const handleRoleChange = async (role: 'admin' | 'leader' | 'member') => {
        const result = await updateUser(user.uid, { role });
        if (result.success) {
            toast({ title: "Sucesso", description: `Função de ${user.displayName} atualizada para ${role}.` });
            // Optionally, trigger a re-fetch of the data
        } else {
            toast({ title: "Erro", description: result.message, variant: "destructive" });
        }
    };

    const handleStatusChange = async (disabled: boolean) => {
        const result = await updateUser(user.uid, { disabled });
        if (result.success) {
            toast({ title: "Sucesso", description: `Status de ${user.displayName} atualizado.` });
        } else {
            toast({ title: "Erro", description: result.message, variant: "destructive" });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.uid)}>
                    Copiar ID do Usuário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Alterar Função</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleRoleChange('admin')}>Admin</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('leader')}>Líder</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange('member')}>Membro</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => handleStatusChange(!user.disabled)}>
                    {user.disabled ? 'Ativar Usuário' : 'Desativar Usuário'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "displayName",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Nome
                <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Função",
    },
    {
        accessorKey: "disabled",
        header: "Status",
        cell: ({ row }) => (row.original.disabled ? 
            <span className="text-red-500 font-medium">Desativado</span> : 
            <span className="text-green-500 font-medium">Ativo</span>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => <UserActions user={row.original} />,
    },
];
