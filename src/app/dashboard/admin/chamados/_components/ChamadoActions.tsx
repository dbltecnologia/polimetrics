'use client';

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { deleteChamadoAction, updateChamadoStatusAction } from "../actions";
import { useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";

export function ChamadoActions({ id, currentStatus }: { id: string, currentStatus?: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const status = currentStatus || 'aberto';

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

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            const res = await updateChamadoStatusAction(id, newStatus);
            if (res?.error) {
                toast({ title: "Erro", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Status Atualizado", description: "O status do chamado foi atualizado." });
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
            </Select>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 flex-shrink-0"
                title="Remover chamado"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
