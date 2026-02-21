'use client';

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteChamadoAction } from "../actions";
import { useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";

export function ChamadoActions({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        if (confirm("Tem certeza que deseja remover este chamado?")) {
            startTransition(async () => {
                const res = await deleteChamadoAction(id);
                if (res?.error) {
                    toast({ title: "Erro", description: res.error, variant: "destructive" });
                } else {
                    toast({ title: "Chamado Removido", description: "O chamado foi excluído com sucesso." });
                }
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8"
            title="Remover chamado"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
