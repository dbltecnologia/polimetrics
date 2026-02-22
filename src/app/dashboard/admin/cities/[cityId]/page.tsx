import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import { getCityById } from '@/services/admin/cities/getCityById';
import { ChevronLeft, MapPin, Users, Vote } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

type Member = {
    id: string;
    name?: string;
    votePotential?: number;
    cityId?: string;
    neighborhood?: string;
    street?: string;
};

// Types for aggregation
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

    const members = await getCityMembers(cityId);

    // Agrregation Logic for Drill-down: Bairros
    const neighborhoodMap = new Map<string, NeighborhoodStats>();
    let totalVotePotential = 0;

    members.forEach(member => {
        const bairro = member.neighborhood || 'Bairro Não Informado';
        const potential = Number(member.votePotential) || 0;

        totalVotePotential += potential;

        const current = neighborhoodMap.get(bairro) || { name: bairro, memberCount: 0, votePotential: 0 };
        current.memberCount += 1;
        current.votePotential += potential;

        neighborhoodMap.set(bairro, current);
    });

    const neighborhoods = Array.from(neighborhoodMap.values()).sort((a, b) => b.votePotential - a.votePotential);

    return (
        <main>
            <AdminHeader
                title={`Cidade: ${city.name} - ${city.state}`}
                subtitle="Divisão territorial de bairros e influência."
            >
                <Link
                    href="/dashboard/admin/cities"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar para Cidades
                </Link>
            </AdminHeader>
            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground">Desempenho da Base</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-primary/5 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <Users className="h-4 w-4" />
                                Apoiadores Totais
                            </div>
                            <p className="mt-2 text-2xl font-bold text-foreground">{members.length}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                <Vote className="h-4 w-4" />
                                Potencial Estimado
                            </div>
                            <p className="mt-2 text-2xl font-bold text-emerald-900">
                                {totalVotePotential.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
            <div className="p-6 md:p-8 pt-0">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Distribuição por Bairros</h3>
                            <p className="text-sm text-muted-foreground">Clique em um bairro para desdobrar as ruas (Drill-down).</p>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {neighborhoods.length > 0 ? (
                            neighborhoods.map((nb) => (
                                <Link
                                    key={nb.name}
                                    href={`/dashboard/admin/cities/${cityId}/bairros/${encodeURIComponent(nb.name)}`}
                                    className="block">

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
                </div>
            </div>
        </main>
    );
}
