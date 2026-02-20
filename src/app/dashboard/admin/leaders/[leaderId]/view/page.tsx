import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import { getLeaderById } from '@/services/admin/leaders/getLeaderById';
import { CalendarDays, ChevronLeft, Users, Vote } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

type Member = {
  id: string;
  name?: string;
  votePotential?: number;
  city?: string;
  neighborhood?: string;
};

async function getMembers(leaderId: string) {
  const snapshot = await firestore
    .collection('members')
    .where('leaderId', '==', leaderId)
    .orderBy('name')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Member;
    return { ...data, id: doc.id };
  });
}

async function getLeaderMembersTotals(leaderId: string): Promise<{ totalMembers: number; totalVotePotential: number }> {
  try {
    const baseQuery = firestore.collection('members').where('leaderId', '==', leaderId);

    const totalMembers = await (async () => {
      try {
        if (typeof (baseQuery as any).count === 'function') {
          const agg = await (baseQuery as any).count().get();
          return Number(agg.data()?.count) || 0;
        }
      } catch {}
      const snap = await baseQuery.select('leaderId').get();
      return snap.size;
    })();

    const totalVotePotential = await (async () => {
      try {
        if (typeof (baseQuery as any).aggregate === 'function') {
          const agg = await (baseQuery as any).aggregate({
            total: (firestore as any).AggregateField?.sum
              ? (firestore as any).AggregateField.sum('votePotential')
              : (firestore as any).FieldValue?.sum?.('votePotential'),
          }).get();
          const value = agg.data?.()?.total ?? agg.data?.().total;
          return Number(value) || 0;
        }
      } catch {}

      const snap = await baseQuery.select('votePotential').get();
      let sum = 0;
      snap.forEach((doc) => {
        sum += Number((doc.data() as any).votePotential) || 0;
      });
      return sum;
    })();

    return { totalMembers, totalVotePotential };
  } catch (error) {
    console.error(`[leaders/view] Falha ao calcular totais do líder ${leaderId}:`, error);
    return { totalMembers: 0, totalVotePotential: 0 };
  }
}

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

export default async function ViewLeaderPage({ params }: { params: { leaderId: string } }) {
  const leader = await getLeaderById(params.leaderId);

  if (!leader) {
    return (
      <main className="p-6 md:p-8">
        <AdminHeader title="Líder não encontrado" subtitle="Verifique o ID informado." />
      </main>
    );
  }

  const [members, totals] = await Promise.all([
    getMembers(params.leaderId),
    getLeaderMembersTotals(params.leaderId),
  ]);

  return (
    <main>
      <AdminHeader
        title={`Líder: ${leader.name ?? 'Sem nome'}`}
        subtitle="Dados do líder, membros e potencial de votos."
      >
        <Link
          href="/dashboard/admin/leaders"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </AdminHeader>

      <div className="grid gap-6 p-6 md:grid-cols-[1.1fr,0.9fr] md:p-8">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Dados do líder</h2>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">ID:</span> {(leader as any).id ?? leader.uid}</p>
            <p><span className="font-semibold text-foreground">Nome:</span> {leader.name ?? 'Não informado'}</p>
            <p><span className="font-semibold text-foreground">Email:</span> {leader.email ?? 'Não informado'}</p>
            <p><span className="font-semibold text-foreground">Tipo:</span> {roleLabel(leader.role)}</p>
            <p><span className="font-semibold text-foreground">Instagram:</span> {leader.instagram ?? '-'}</p>
            <p><span className="font-semibold text-foreground">Facebook:</span> {leader.facebook ?? '-'}</p>
            {leader.createdAt && (
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>Cadastro: {formatDate(leader.createdAt)}</span>
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/dashboard/admin/leaders/${params.leaderId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:-translate-y-[1px] hover:bg-primary/90"
            >
              Editar líder
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Resumo rápido</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4" />
                Membros
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{totals.totalMembers}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Vote className="h-4 w-4" />
                Potencial de votos
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {totals.totalVotePotential.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 md:p-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Membros do líder</h3>
              <p className="text-sm text-muted-foreground">Primeiros 50 membros associados.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{member.name ?? 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground">
                  {member.city ?? 'Cidade não informada'} {member.neighborhood ? `• ${member.neighborhood}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Potencial de voto: {Number(member.votePotential) || 0}
                </p>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum membro encontrado para este líder.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
