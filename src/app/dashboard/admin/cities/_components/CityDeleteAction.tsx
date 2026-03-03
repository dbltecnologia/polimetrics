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
import { deleteCity } from '@/services/admin/cities/deleteCity';

export function CityDeleteAction({ cityId, cityName }: { cityId: string; cityName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const result = await deleteCity(cityId);

            if (!result.success) {
                throw new Error(result.message);
            }

            toast({
                title: 'Cidade excluída',
                description: `"${cityName}" foi removida com sucesso.`,
            });

            router.refresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir cidade',
                description: error.message || 'Houve um erro ao tentar excluir a cidade.',
            });
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={(e) => e.stopPropagation()}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Cidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a cidade <strong>{cityName}</strong>?<br /><br />
                        Esta ação não pode ser desfeita. Líderes e apoiadores vinculados a esta cidade perderão o vínculo.
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
