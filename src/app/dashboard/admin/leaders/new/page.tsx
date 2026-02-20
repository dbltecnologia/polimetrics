
export const dynamic = 'force-dynamic';

import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LeaderForm } from '@/app/dashboard/admin/leaders/_components/LeaderForm';
import { getAllCities } from '@/services/admin/cities/getAllCities';

/**
 * Página de criação de líder (Admin).
 */
export default async function NewLeaderPage() {
  const cities = await getAllCities();
  return (
    <main>
      <AdminHeader
        title="Adicionar Líder"
        subtitle="Crie um acesso para um líder e preencha os dados básicos."
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
        <LeaderForm cities={cities} />
      </div>
    </main>
  );
}
