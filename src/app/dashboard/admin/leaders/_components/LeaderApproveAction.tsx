'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const [approved, setApproved] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/leaders/${leaderId}/approve`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Erro ao aprovar.');
            }
            toast({ title: 'Líder aprovado!', description: `${leaderName} agora tem acesso ao sistema.` });
            setApproved(true);
            onApproved?.();
            router.refresh(); // Força a Server Component a re-buscar os dados
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
            className={`h-8 gap-1.5 text-xs ${approved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
            onClick={handleApprove}
            disabled={isLoading || approved}
        >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {approved ? 'Aprovado ✓' : 'Aprovar'}
        </Button>
    );
}
