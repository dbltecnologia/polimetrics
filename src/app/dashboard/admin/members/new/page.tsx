
import { getLeaders } from '@/services/admin/getLeaders';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { MemberForm } from '@/app/dashboard/admin/members/_components/MemberForm';
import { AppUser } from '@/types/user';

export const revalidate = 0; // Garante que os dados dos líderes sejam sempre recentes

export default async function NewMemberPage() {
  
  // Busca todos os líderes para então filtrar apenas os subordinados.
  const allLeaders: AppUser[] = await getLeaders();
  const subLeaders = allLeaders.filter(leader => leader.role === 'sub');

  // Se não houver líderes subordinados, exibe uma mensagem informativa.
  if (subLeaders.length === 0) {
    return (
      <main>
        <AdminHeader 
          title="Adicionar Novo Membro"
          subtitle="Não há líderes subordinados cadastrados para vincular a um membro."
        />
        <div className="p-6 md:p-8">
            <p className="text-muted-foreground">
                Por favor, cadastre primeiro um líder do tipo &quot;Subordinado&quot; na <a href="/dashboard/admin/leaders/new" className="text-blue-500 hover:underline">página de líderes</a>.
            </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <AdminHeader 
        title="Adicionar Novo Membro"
        subtitle="Preencha os dados e vincule o membro a um líder subordinado."
      />
      <div className="p-6 md:p-8">
        <MemberForm leaders={subLeaders} />
      </div>
    </main>
  );
}
