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

export function MemberDeleteAction({ memberId, memberName, onDelete }: { memberId: string; memberName: string; onDelete?: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/members/${memberId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Falha ao excluir o membro.');
            }

            toast({
                title: 'Membro excluído',
                description: `"${memberName}" foi removido com sucesso.`,
            });

            if (onDelete) {
                onDelete();
            } else {
                router.refresh();
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir membro',
                description: error.message || 'Houve um erro ao tentar excluir o membro.',
            });
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Membro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir <strong>{memberName}</strong>?<br /><br />
                        Esta ação não pode ser desfeita.
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
