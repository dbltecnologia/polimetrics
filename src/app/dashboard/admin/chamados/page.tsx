export const dynamic = 'force-dynamic';

import { getAllChamados } from '@/services/chamadosService';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { ChamadosList } from './_components/ChamadosList';

export default async function ChamadosPage() {
  const chamados = await getAllChamados();

  const formatDate = (value: any) => {
    if (!value) return '';
    const date = (value as any).toDate ? (value as any).toDate() : new Date(value);
    return isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="p-3 md:p-8 space-y-4">
      <AdminHeader
        title="Chamados / Demandas"
        subtitle="Mensagens enviadas pelos líderes."
      />
      <ChamadosList chamados={chamados.filter(Boolean)} />
    </div>
  );
}
