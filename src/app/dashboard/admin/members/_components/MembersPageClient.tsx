'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MembersAdminTable from '@/components/admin/members/MembersAdminTable';
import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { MemberDeleteAction } from '@/components/admin/members/MemberDeleteAction';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import {
    MapPin, Phone, Users as UsersIcon, User, Vote, ShieldCheck,
    UsersRound, Search, Pencil,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    initialMembers: Member[];
    initialLeaders: AppUser[];
}

/**
 * IMPROVEMENT #13: Client-only component that receives SSR-fetched data as props.
 * All filter state remains client-side; the heavy Firestore query runs on the server.
 */
export function MembersPageClient({ initialMembers, initialLeaders }: Props) {
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
    const [selectedMaster, setSelectedMaster] = useState<string>('all');
    const [selectedSub, setSelectedSub] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const { masterLeaders, subLeaders, filteredMembers, availableCities, availableNeighborhoods } = useMemo(() => {
        const masters = initialLeaders.filter(l => l.role === 'master');
        let subs = initialLeaders.filter(l => l.role === 'sub');
        let members = initialMembers;

        if (selectedMaster !== 'all') {
            const subIdsOfMaster = initialLeaders
                .filter(l => l.parentLeaderId === selectedMaster)
                .map(l => l.id);
            subs = subs.filter(s => subIdsOfMaster.includes(s.id));
            const subIdsSet = new Set(subIdsOfMaster);
            members = initialMembers.filter(m => m.leaderId && subIdsSet.has(m.leaderId));
        }
        if (selectedSub !== 'all') {
            members = members.filter(m => m.leaderId === selectedSub);
        }

        const citiesSet = new Set<string>();
        const neighborhoodsSet = new Set<string>();
        members.forEach(m => {
            if ((m as any).cityName) citiesSet.add((m as any).cityName);
            const nb = (m as any).bairro || (m as any).neighborhood;
            if (nb) neighborhoodsSet.add(nb);
        });
        const availableCities = Array.from(citiesSet).sort();

        if (selectedCity !== 'all') {
            members = members.filter(m => (m as any).cityName === selectedCity);
        }
        const localNeighborhoodsSet = new Set<string>();
        members.forEach(m => {
            const nb = (m as any).bairro || (m as any).neighborhood;
            if (nb) localNeighborhoodsSet.add(nb);
        });
        const availableNeighborhoods = Array.from(localNeighborhoodsSet).sort();

        if (selectedNeighborhood !== 'all') {
            members = members.filter(
                m => (m as any).bairro === selectedNeighborhood || (m as any).neighborhood === selectedNeighborhood,
            );
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            members = members.filter(
                m =>
                    m.name?.toLowerCase().includes(lowerSearch) ||
                    m.phone?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')),
            );
        }
        return { masterLeaders: masters, subLeaders: subs, filteredMembers: members, availableCities, availableNeighborhoods };
    }, [selectedMaster, selectedSub, selectedCity, selectedNeighborhood, searchTerm, initialMembers, initialLeaders]);

    const kpis = useMemo(() => {
        const total = initialMembers.length;
        const totalFiltered = filteredMembers.length;
        const active = filteredMembers.filter(m => m.status === 'ativo').length;
        const inactive = filteredMembers.filter(m => m.status === 'inativo').length;
        const potential = filteredMembers.filter(m => m.status === 'potencial').length;
        const votePotential = filteredMembers.reduce((acc, m) => acc + (Number((m as any).votePotential) || 0), 0);
        const cities = new Set(filteredMembers.map(m => (m as any).cityId).filter(Boolean)).size;
        return { total, totalFiltered, active, inactive, potential, votePotential, cities };
    }, [initialMembers, filteredMembers]);

    const insight = useMemo(() => {
        const leaderVotes = new Map<string, { name: string; votes: number; count: number }>();
        const cityVotes = new Map<string, { name: string; votes: number; count: number }>();
        for (const member of filteredMembers) {
            const votes = Number((member as any).votePotential) || 0;
            const leaderName = member.leaderName || 'Sem líder';
            const leaderKey = member.leaderId || leaderName;
            const leaderEntry = leaderVotes.get(leaderKey) || { name: leaderName, votes: 0, count: 0 };
            leaderEntry.votes += votes;
            leaderEntry.count += 1;
            leaderVotes.set(leaderKey, leaderEntry);
            const cityName = (member as any).cityName || 'Cidade não informada';
            const cityKey = (member as any).cityId || cityName;
            const cityEntry = cityVotes.get(cityKey) || { name: cityName, votes: 0, count: 0 };
            cityEntry.votes += votes;
            cityEntry.count += 1;
            cityVotes.set(cityKey, cityEntry);
        }
        const topLeader = [...leaderVotes.values()].sort((a, b) => b.votes - a.votes)[0];
        const topCity = [...cityVotes.values()].sort((a, b) => b.votes - a.votes)[0];
        const votesPerSupporter = filteredMembers.length
            ? Math.round(kpis.votePotential / filteredMembers.length)
            : 0;
        return { topLeader, topCity, votesPerSupporter };
    }, [filteredMembers, kpis.votePotential]);

    useEffect(() => { setSelectedSub('all'); }, [selectedMaster]);
    useEffect(() => { setSelectedNeighborhood('all'); }, [selectedCity]);

    return (
        <main className="p-3 md:p-8 space-y-4">
            <AdminHeader
                title="Apoiadores da Base"
                subtitle="Gestão de liderados, potencial de votos e status da rede."
            />

            <div className="flex justify-end mb-3">
                <Link href="/dashboard/admin/members/new">
                    <Button className="h-9 w-9 rounded-full shadow-sm" size="icon" title="Adicionar Membro">+</Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                {[
                    { label: 'Exibindo', value: kpis.totalFiltered, sub: `de ${kpis.total}`, icon: <UsersRound className="h-4 w-4 text-primary" /> },
                    { label: 'Potencial', value: kpis.votePotential.toLocaleString('pt-BR'), sub: 'votos', icon: <Vote className="h-4 w-4 text-emerald-700" /> },
                    { label: 'Ativos', value: kpis.active, icon: <ShieldCheck className="h-4 w-4 text-primary" /> },
                    { label: 'Inativos', value: kpis.inactive, icon: <ShieldCheck className="h-4 w-4 text-rose-600" /> },
                    { label: 'Potenciais', value: kpis.potential, icon: <ShieldCheck className="h-4 w-4 text-amber-600" /> },
                    { label: 'Cidades', value: kpis.cities, icon: <MapPin className="h-4 w-4 text-primary" /> },
                ].map((kpi) => (
                    <Card key={kpi.label} className="shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                                {kpi.icon}
                            </div>
                            <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
                            {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4 text-sm">
                    <p className="font-semibold">Informativo rápido</p>
                    <p className="mt-1 text-muted-foreground">
                        {insight.topLeader
                            ? `Top líder no filtro: ${insight.topLeader.name} (${insight.topLeader.votes.toLocaleString('pt-BR')} votos / ${insight.topLeader.count} apoiadores).`
                            : 'Sem líderes vinculados no filtro atual.'}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                        {insight.topCity
                            ? `Top cidade no filtro: ${insight.topCity.name} (${insight.topCity.votes.toLocaleString('pt-BR')} votos / ${insight.topCity.count} apoiadores).`
                            : 'Sem cidades no filtro atual.'}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                        Média estimada: <span className="font-semibold text-foreground">{insight.votesPerSupporter.toLocaleString('pt-BR')}</span> votos por apoiador.
                    </p>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-3 my-4">
                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar nome ou telefone..."
                        className="pl-8 h-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Select onValueChange={setSelectedCity} value={selectedCity}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Filtrar por Cidade" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Cidades</SelectItem>
                            {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedNeighborhood} value={selectedNeighborhood} disabled={selectedCity === 'all' || availableNeighborhoods.length === 0}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Filtrar por Bairro" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Bairros</SelectItem>
                            {availableNeighborhoods.map(hood => <SelectItem key={hood} value={hood}>{hood}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedMaster} value={selectedMaster}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Filtrar por Líder Master" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Líderes Master</SelectItem>
                            {masterLeaders.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedSub} value={selectedSub}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Filtrar por Líder Subordinado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Líderes Subordinados</SelectItem>
                            {subLeaders.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                    Exibindo {filteredMembers.length} de {initialMembers.length} apoiadores.
                </p>
            </div>

            {/* Lista mobile */}
            <div className="mt-3 space-y-3 md:hidden px-1">
                {filteredMembers.map((member) => (
                    <div key={member.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-base font-semibold text-slate-900">{member.name || 'Nome não informado'}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UsersIcon className="h-4 w-4 text-primary" />
                                    <span>{member.leaderName || 'Sem líder'}</span>
                                </div>
                                {(member as any).cityName && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="line-clamp-1">{(member as any).cityName}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span>{member.phone || 'Sem telefone'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Vote className="h-4 w-4 text-emerald-700" />
                                    <span>{Number((member as any).votePotential || 0).toLocaleString('pt-BR')} votos</span>
                                </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${member.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' : member.status === 'inativo' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                {member.status}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" asChild className="h-8 w-8">
                                <Link href={`/dashboard/admin/members/${member.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                </Link>
                            </Button>
                            {/* Note: onDelete revalidation now handled via server — no local refetch needed */}
                            <MemberDeleteAction memberId={member.id} memberName={member.name || 'Membro'} onDelete={() => window.location.reload()} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela desktop */}
            <div className="mt-2 hidden md:block border rounded-lg overflow-hidden">
                <MembersAdminTable members={filteredMembers} />
            </div>
        </main>
    );
}
