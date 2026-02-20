'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { useSession } from '@/context/session-context';



type MemberSummary = {
    id: string;
    name: string;
    phone?: string | null;
    city?: string;
    state?: string;
    status?: string;
    lastContact?: string | null;
};

type Leader = {
    id: string;
    name?: string;
    cityId?: string | null;
};

type DashboardData = {
    members: MemberSummary[];
    leader: Leader | null;
    totalVotePotential?: number;
};



export default function LeaderDashboardPage() {
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const { user, loading } = useSession();
    const [leader, setLeader] = useState<Leader | null>(null);
    const [totalVotePotential, setTotalVotePotential] = useState(0);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoadingData(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoadingData(true);
                setError(null);

                const response = await fetch(`/api/leader/dashboard?uid=${user.uid}`);

                if (!response.ok) {
                    throw new Error('Falha ao carregar dados do líder.');
                }

                const data: DashboardData = await response.json();
                setMembers(data.members || []);
                setLeader(data.leader || null);
                setTotalVotePotential(data.totalVotePotential || 0);
            } catch (err) {
                console.error('[leader/page] Erro ao carregar dados:', err);
                setError('Não foi possível carregar os dados. Tente novamente.');
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [user]);

    if (loading || loadingData) {
        return <p>Carregando...</p>;
    }

    if (!user) {
        return <p>Redirecionando para o login...</p>;
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-4">
                <p className="text-red-600 font-semibold">{error}</p>
                <Button onClick={() => location.reload()}>Tentar novamente</Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard do Líder</h1>
                <p className="text-muted-foreground">Bem-vindo, {leader?.name || 'Líder'}!</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Liderados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{members.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Potencial de Votos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{totalVotePotential}</p>
                    </CardContent>
                </Card>
            </div>

            {!leader?.cityId && (
                <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
                    ⚠ Complete seu perfil adicionando sua cidade.
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <p>Nenhuma novidade no Gabinete Virtual no momento. Em breve, Propostas e Minivotações.</p>
            </div>
        </div>
    );
}
