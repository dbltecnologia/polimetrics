'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export function LeaderDeleteAction({ leaderId, leaderName }: { leaderId: string, leaderName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/leaders/${leaderId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Falha ao excluir o líder.');
            }

            toast({
                title: 'Líder excluído',
                description: 'O líder e seus acessos foram removidos com sucesso.',
            });

            router.refresh();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro de exclusão',
                description: 'Houve um erro ao tentar excluir o líder. Tente novamente mais tarde.',
            });
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Líder Político?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja apagar o registro de <strong>{leaderName}</strong>? <br /><br />
                        Isso removerá instantaneamente seu acesso no sistema (Firebase Auth) e apagará seu documento no Banco de Dados. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Confirmar Exclusão
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
