export const dynamic = 'force-dynamic';

import { getAdminStats } from "@/services/admin/getAdminStats";
import { getBairrosStats } from "@/services/admin/getBairrosStats";
import { getAllCities } from "@/services/cityService";

import { AdminStatCard } from "./_components/AdminStatCard";
import { Users, UsersRound, Building, MapPin, Vote, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminQuickAccess } from "./_components/AdminQuickAccess";
import { AdminCompactMetrics } from "./_components/AdminCompactMetrics";
import { BairrosChart } from "./_components/BairrosChart";

export default async function AdminDashboardPage() {

  const [adminStats, bairrosStats, cities] = await Promise.all([
    getAdminStats(),
    getBairrosStats(),
    getAllCities(),
  ]);

  const stats = {
    totalCities: cities.length,
    totalLeaders: adminStats?.totalLeaders || 0,
    totalMembers: adminStats?.totalMembers || 0,
    totalVotePotential: adminStats?.totalVotePotential || 0,
    activePolls: adminStats?.activePolls || 0,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 md:px-10 md:py-10 text-white shadow-xl mx-3 md:mx-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Painel do Deputado</p>
            <h1 className="text-3xl font-bold">Dashboard Político</h1>
            <p className="text-sm text-slate-200/90">
              Visão unificada das cidades, líderes, apoiadores e minivotações em andamento.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:gap-3">

            <Button variant="outline" asChild className="w-full md:w-auto justify-center bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link href="/dashboard/admin/chamados">Demandas</Link>
            </Button>
            <Button variant="default" asChild className="w-full md:w-auto justify-center bg-sky-500 text-white hover:bg-sky-600">
              <Link href="/dashboard/admin/eleicoes">Histórico Eleitoral</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-6 px-3 md:px-8">
        <AdminStatCard
          title="Cidades"
          value={stats.totalCities}
          icon={Building}
          description="Atuação ativa"
          href="/dashboard/admin/cities"
        />
        <AdminStatCard
          title="Líderes"
          value={stats.totalLeaders}
          icon={Users}
          description="Mobilizadores"
          href="/dashboard/admin/leaders"
        />
        <AdminStatCard
          title="Apoiadores"
          value={stats.totalMembers}
          icon={UsersRound}
          description="Base cadastrada"
          href="/dashboard/admin/members"
        />
        <AdminStatCard
          title="Potencial Votos"
          value={stats.totalVotePotential}
          icon={Star}
          description="Votos esperados"
          href="/dashboard/admin/members" // Na falta de rota específica inicial, listamos membros filtráveis
        />
        <AdminStatCard
          title="Minivotações"
          value={stats.activePolls}
          icon={Vote}
          description="Enquetes ativas"
          href="/dashboard/admin/votacoes"
        />
      </div>

      <AdminCompactMetrics />

      <AdminQuickAccess />

      <div className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr] px-3 md:px-8">
        <div className="space-y-6">
          <BairrosChart data={bairrosStats} />
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b flex-none bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-lg">Mapa Político</CardTitle>
              <p className="text-sm text-muted-foreground">Localização geográfica dos seus líderes.</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm pt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-slate-800">Visualizar líderes no mapa</span>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/admin/mapa-politico">Abrir Mapa</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
