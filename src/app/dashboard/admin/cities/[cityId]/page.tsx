import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import { getCityById } from '@/services/admin/cities/getCityById';
import { ChevronLeft, MapPin, Users, Vote, UserCheck } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

type Member = {
    id: string;
    name?: string;
    votePotential?: number;
    cityId?: string;
    neighborhood?: string;
    bairro?: string;
    street?: string;
};

type LeaderInCity = {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    memberCount?: number;
};

type NeighborhoodStats = {
    name: string;
    memberCount: number;
    votePotential: number;
};

async function getCityMembers(cityId: string) {
    const snapshot = await firestore
        .collection('members')
        .where('cityId', '==', cityId)
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data() as Member;
        return { ...data, id: doc.id };
    });
}

async function getCityLeaders(cityId: string): Promise<LeaderInCity[]> {
    const snapshot = await firestore
        .collection('users')
        .where('cityId', '==', cityId)
        .get();

    if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LeaderInCity));
    }

    // Fallback: busca na coleção 'leaders' legada
    const leadersSnap = await firestore
        .collection('leaders')
        .where('cityId', '==', cityId)
        .get().catch(() => null);

    return (leadersSnap?.docs || []).map((doc) => ({ id: doc.id, ...doc.data() } as LeaderInCity));
}

const roleLabel = (role?: string) => {
    if (role === 'master') return 'Líder Master';
    if (role === 'sub') return 'Líder Subordinado';
    return 'Líder';
};

export default async function ViewCityPage({ params }: { params: Promise<{ cityId: string }> }) {
    const { cityId } = await params;
    const city = await getCityById(cityId);

    if (!city) {
        return (
            <main className="p-6 md:p-8">
                <AdminHeader title="Cidade não encontrada" subtitle="Verifique o ID informado." />
            </main>
        );
    }

    const [members, leaders] = await Promise.all([
        getCityMembers(cityId),
        getCityLeaders(cityId),
    ]);

    // Agregação por bairro
    const neighborhoodMap = new Map<string, NeighborhoodStats>();
    let totalVotePotential = 0;

    members.forEach(member => {
        const bairro = member.bairro || member.neighborhood || 'Bairro Não Informado';
        const potential = Number(member.votePotential) || 0;

        totalVotePotential += potential;

        const current = neighborhoodMap.get(bairro) || { name: bairro, memberCount: 0, votePotential: 0 };
        current.memberCount += 1;
        current.votePotential += potential;
        neighborhoodMap.set(bairro, current);
    });

    const neighborhoods = Array.from(neighborhoodMap.values()).sort((a, b) => b.votePotential - a.votePotential);
    const activeLeaders = leaders.filter(l => l.status !== 'inativo' && l.status !== 'pending_verification');

    return (
        <main>
            <AdminHeader
                title={`Cidade: ${city.name} - ${city.state}`}
                subtitle="Líderes e apoiadores desta cidade."
            >
                <Link
                    href="/dashboard/admin/cities"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar para Cidades
                </Link>
            </AdminHeader>

            {/* KPIs */}
            <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8 pb-0">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                        <Users className="h-4 w-4" />
                        Apoiadores
                    </div>
                    <p className="text-3xl font-bold text-foreground">{members.length}</p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-2">
                        <UserCheck className="h-4 w-4" />
                        Líderes
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{activeLeaders.length}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-2">
                        <Vote className="h-4 w-4" />
                        Potencial Estimado
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">
                        {totalVotePotential.toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
                {/* Líderes da cidade */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Líderes nesta Cidade</h2>
                    {activeLeaders.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">Nenhum líder cadastrado nesta cidade.</p>
                    ) : (
                        <div className="space-y-2">
                            {activeLeaders.map((leader) => (
                                <Link
                                    key={leader.id}
                                    href={`/dashboard/admin/leaders/${leader.id}/view`}
                                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-accent hover:border-primary/30 transition-all"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{leader.name || 'Sem nome'}</p>
                                        <p className="text-xs text-muted-foreground">{roleLabel(leader.role)}</p>
                                    </div>
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                        Ver perfil →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Desempenho dos apoiadores por bairro */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground">Apoiadores por Bairro</h2>
                    <p className="text-sm text-muted-foreground mb-4">Clique em um bairro para desdobrar as ruas.</p>
                    <div className="grid gap-3">
                        {neighborhoods.length > 0 ? (
                            neighborhoods.map((nb) => (
                                <Link
                                    key={nb.name}
                                    href={`/dashboard/admin/cities/${cityId}/bairros/${encodeURIComponent(nb.name)}`}
                                    className="block"
                                >
                                    <div className="rounded-xl border border-border bg-background px-4 py-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <h4 className="text-base font-semibold text-foreground line-clamp-1">{nb.name}</h4>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{nb.memberCount} apoiadores</span>
                                            <span className="font-semibold text-emerald-700">{nb.votePotential.toLocaleString('pt-BR')} pct</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-3 p-8 text-center text-muted-foreground">
                                Nenhum bairro com apoiadores registrado nesta cidade.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
