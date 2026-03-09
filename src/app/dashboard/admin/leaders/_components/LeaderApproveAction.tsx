'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function LeaderApproveAction({
    leaderId,
    leaderName,
    onApproved,
}: {
    leaderId: string;
    leaderName: string;
    onApproved?: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/leaders/${leaderId}/approve`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Erro ao aprovar.');
            }
            toast({ title: 'Líder aprovado!', description: `${leaderName} agora tem acesso ao sistema.` });
            onApproved?.();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs"
            onClick={handleApprove}
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Aprovar
        </Button>
    );
}
