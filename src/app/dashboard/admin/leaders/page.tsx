
import { getLeaders } from '@/services/admin/getLeaders'; // Corrigido: Importa do local correto
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { LeaderDeleteAction } from './_components/LeaderDeleteAction';
import { Button } from "@/components/ui/button";
import { PlusCircle, CalendarDays, Users, Eye, Pencil, BadgeCheck, Target, Users2 } from "lucide-react";
import Link from "next/link";
import type { AppUser } from '@/types/user';
import { firestore } from '@/lib/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote } from 'lucide-react';
import { getAllCities } from '@/services/admin/cities/getAllCities';

// Força a página a ser dinâmica para garantir que os dados estejam sempre atualizados.
export const revalidate = 0;

const roleLabel = (role?: string) => {
  if (role === 'master') return 'Líder Master';
  if (role === 'sub') return 'Líder Subordinado';
  if (role === 'leader') return 'Líder';
  if (role === 'lider') return 'Líder';
  return 'Indefinido';
};

const formatDate = (value?: any) => {
  if (!value) return null;
  const date = (value as any).toDate ? (value as any).toDate() : new Date(value as string);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

type LeaderWithStats = AppUser & {
  memberCount: number;
  votePotential: number;
  cityName?: string | null;
  status?: 'ativo' | 'inativo' | string;
};

export default async function LeadersPage() {
  const [leaders, membersSnapshot, chamadosSnapshot, cities] = await Promise.all([
    getLeaders(),
    firestore.collection('members').select('leaderId', 'votePotential').get().catch(() => null),
    firestore.collection('chamados').select('leaderId', 'status').get().catch(() => null),
    getAllCities(),
  ]);

  const cityById = new Map(cities.map((c) => [c.id, `${c.name} - ${c.state}`]));

  const memberCountByLeaderId: Record<string, number> = {};
  const votePotentialByLeaderId: Record<string, number> = {};
  if (membersSnapshot && !membersSnapshot.empty) {
    membersSnapshot.forEach((doc) => {
      const data = doc.data() as any;
      const leaderId = data.leaderId as string | undefined;
      if (!leaderId) return;
      memberCountByLeaderId[leaderId] = (memberCountByLeaderId[leaderId] || 0) + 1;
      votePotentialByLeaderId[leaderId] = (votePotentialByLeaderId[leaderId] || 0) + (Number(data.votePotential) || 0);
    });
  }

  const chamadosByLeaderId: Record<string, { total: number; abertos: number }> = {};
  if (chamadosSnapshot && !chamadosSnapshot.empty) {
    chamadosSnapshot.forEach((doc) => {
      const data = doc.data() as any;
      const leaderId = data.leaderId as string | undefined;
      if (!leaderId) return;
      chamadosByLeaderId[leaderId] ??= { total: 0, abertos: 0 };
      chamadosByLeaderId[leaderId].total += 1;
      if ((data.status as string | undefined) === 'aberto') chamadosByLeaderId[leaderId].abertos += 1;
    });
  }

  const leadersWithStats: LeaderWithStats[] = leaders.map((leader) => {
    const leaderId = (leader as any).id ?? leader.uid ?? leader.email ?? 'sem-id';
    const cityName = leader.cityId ? (cityById.get(leader.cityId as any) || null) : null;
    return {
      ...leader,
      memberCount: memberCountByLeaderId[leaderId] || 0,
      votePotential: votePotentialByLeaderId[leaderId] || 0,
      cityName,
      status: (leader as any).status,
      chamadosTotal: chamadosByLeaderId[leaderId]?.total || 0,
      chamadosAbertos: chamadosByLeaderId[leaderId]?.abertos || 0,
    } as any;
  });

  const totalMembers = leadersWithStats.reduce((acc, l) => acc + (l.memberCount || 0), 0);
  const totalVotePotential = leadersWithStats.reduce((acc, l) => acc + (l.votePotential || 0), 0);
  const totalMasters = leaders.filter((l: AppUser) => l.role === 'master').length;
  const totalSubs = leaders.filter((l: AppUser) => l.role === 'sub').length;
  const totalLeaders = leaders.length;

  return (
    <main className="max-w-6xl mx-auto">
      <AdminHeader
        title="Líderes Políticos"
        subtitle="Gerencie os líderes que compõem sua rede de apoio."
      >
        <Button asChild>
          <Link href="/dashboard/admin/leaders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Líder
          </Link>
        </Button>

      </AdminHeader>
      <div className="p-3 md:p-8 space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="block">
            <Card className="shadow-sm border-primary/20 bg-white transition-all h-full">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm text-muted-foreground">Líderes</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl md:text-2xl font-bold text-foreground">{totalLeaders}</p>
                <div className="rounded-full bg-primary/10 p-1.5 md:p-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Link href="/dashboard/admin/members" className="block">

            <Card className="shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm text-muted-foreground">Apoiadores</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl md:text-2xl font-bold text-foreground">{totalMembers}</p>
                <div className="rounded-full bg-emerald-50 p-1.5 md:p-2">
                  <Users2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

          </Link>
          <div className="block">
            <Card className="shadow-sm transition-all h-full">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm text-muted-foreground">Masters</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl md:text-2xl font-bold text-foreground">{totalMasters}</p>
                <div className="rounded-full bg-blue-50 p-1.5 md:p-2">
                  <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-700" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="block">
            <Card className="shadow-sm transition-all h-full">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm text-muted-foreground">Subordinados</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl md:text-2xl font-bold text-foreground">{totalSubs}</p>
                <div className="rounded-full bg-amber-50 p-1.5 md:p-2">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Link href="/dashboard/admin/members" className="block col-span-2 md:col-span-1">

            <Card className="shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm text-muted-foreground">Potencial de Votos (Rede)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl md:text-2xl font-bold text-foreground">{totalVotePotential.toLocaleString('pt-BR')}</p>
                <div className="rounded-full bg-emerald-50 p-1.5 md:p-2">
                  <Vote className="h-4 w-4 md:h-5 md:w-5 text-emerald-700" />
                </div>
              </CardContent>
            </Card>

          </Link>
        </div>

        {/* Lista mobile */}
        <div className="block space-y-3 md:hidden">
          {leadersWithStats.map((leader: any) => {
            const leaderId = (leader as any).id ?? leader.uid ?? leader.email ?? 'sem-id';
            const created = formatDate(leader.createdAt);
            const memberCount = leader.memberCount ?? 0;
            const votes = leader.votePotential ?? 0;
            const status = (leader.status as string | undefined) || 'ativo';
            const demands = leader.chamadosAbertos ? `${leader.chamadosAbertos}/${leader.chamadosTotal}` : `${leader.chamadosTotal || 0}`;
            return (
              <div
                key={leaderId}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-slate-900">{leader.name ?? 'Nome não informado'}</p>
                    <p className="text-sm text-muted-foreground">
                      {roleLabel(leader.role)} {leader.cityName ? `· ${leader.cityName}` : ''}
                    </p>
                    {created && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Criado em {created}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      {memberCount} membros
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      {votes.toLocaleString('pt-BR')} votos
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold ${status === 'inativo' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {status === 'inativo' ? 'Inativo' : 'Ativo'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    Demandas: {demands}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button variant="outline" size="icon" asChild className="h-9 w-9">
                    <Link href={`/dashboard/admin/leaders/${leaderId}`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <Button variant="secondary" size="icon" asChild className="h-9 w-9">
                    <Link href={`/dashboard/admin/leaders/${leaderId}/view`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </Link>
                  </Button>
                  <LeaderDeleteAction leaderId={leaderId} leaderName={leader.name || 'Líder Desconhecido'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabela permanece para telas maiores */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={leadersWithStats as any}
            searchColumn="name"
            searchPlaceholder="Filtrar por nome do líder..."
          />
        </div>
      </div>
    </main>
  );
}
