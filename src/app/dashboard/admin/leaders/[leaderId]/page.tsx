
import { getLeaderById } from '@/services/admin/leaders/getLeaderById';
import { LeaderForm } from '@/app/dashboard/admin/leaders/_components/LeaderForm';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Garante que a página seja renderizada dinamicamente para buscar os dados mais recentes.
export const revalidate = 0;

export default async function EditLeaderPage({ params }: { params: Promise<{ leaderId: string }> }) {
  const { leaderId } = await params;

  const [leader, cities] = await Promise.all([
    getLeaderById(leaderId),
    getAllCities(),
  ]);

  if (!leader) {
    return (
      <main className="p-6 md:p-8">
        <AdminHeader title="Erro" subtitle="Líder não encontrado." />
        <div className="p-6 md:p-8">
          <p>O líder com o ID fornecido não pôde ser encontrado. Verifique se o link está correto ou se o líder não foi removido.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <AdminHeader
        title="Editar Líder"
        subtitle={`Atualize as informações de ${leader.name}.`}
      >
        <Link
          href="/dashboard/admin/leaders"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </AdminHeader>
      <div className="p-6 md:p-8">
        <LeaderForm leader={leader} cities={cities} />
      </div>
    </main>
  );
}
