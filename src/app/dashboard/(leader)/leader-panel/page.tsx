'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/context/session-context';
import { useUser } from '@/contexts/UserContext';
import { AddMemberForm } from '@/components/forms/AddMemberForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Vote, Phone, MapPin } from 'lucide-react';
import { LeaderOnboardingWizard } from '@/components/leader/LeaderOnboardingWizard';

export default function LeaderPanelPage() {
  const { user, loading: sessionLoading } = useSession();
  const { user: profile, loading: profileLoading } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    try {
      setLoadingConfig(true);
      const res = await fetch(`/api/leader/dashboard?uid=${user.uid}`);
      if (!res.ok) throw new Error('Falha ao buscar dados');
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (sessionLoading || profileLoading || loadingConfig) {
    return <div className="p-6">Carregando painel da rede...</div>;
  }

  const isLeader = profile?.role === 'leader';
  const members = dashboardData?.members || [];
  const totalVotePotential = dashboardData?.totalVotePotential || 0;

  const hasIncompleteProfile = isLeader && !profile?.leader?.cityId;
  const hasNoMembers = isLeader && members.length === 0;
  const needsOnboarding = hasIncompleteProfile || hasNoMembers;

  if (needsOnboarding) {
    return (
      <div className="p-2 md:p-6 mt-4">
        <LeaderOnboardingWizard
          profile={profile}
          hasIncompleteProfile={hasIncompleteProfile}
          onComplete={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Minha Rede</h1>
        <p className="text-muted-foreground">
          Gerencie seus apoiadores, adicione novos integrantes e acompanhe seu alcance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Apoiadores
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Na sua base
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potencial de Votos
            </CardTitle>
            <Vote className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {totalVotePotential.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimativa acumulada
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adição */}
        {isLeader && profile?.leader?.cityId && (
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardHeader className="pb-3 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Novo Apoiador
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <AddMemberForm
                  leaderId={profile.leader.id}
                  cityId={profile.leader.cityId}
                  onSuccess={fetchDashboardData}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Membros */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center justify-between">
            Apoiadores Cadastrados
            <span className="text-sm font-normal text-muted-foreground bg-slate-100 px-2 rounded-full">
              {members.length} registros
            </span>
          </h2>

          {members.length === 0 ? (
            <Card className="border-dashed bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
                <Users className="h-10 w-10 text-slate-300 mb-3" />
                <p>Nenhum apoiador adicionado ainda.</p>
                <p className="text-sm">Preencha o formulário ao lado para começar a montar sua rede.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member: any) => (
                <div key={member.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-slate-800 line-clamp-1">{member.name}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${member.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' :
                      member.status === 'inativo' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                      {member.status || 'Potencial'}
                    </span>
                  </div>
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Phone className="h-3 w-3" />
                      {member.phone || 'Sem telefone'}
                    </div>
                    {member.cityName && (
                      <div className="flex items-center text-xs text-slate-500 gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{member.cityName}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs font-medium text-emerald-600 gap-2 mt-2 bg-emerald-50 rounded p-1">
                      <Vote className="h-3 w-3" />
                      {member.votePotential || 0} votos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
