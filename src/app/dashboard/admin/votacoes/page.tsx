import { isAuthenticated } from '@/lib/auth/server-side';
import { redirect } from 'next/navigation';
import { resolveUserRole } from '@/lib/user-role';
import { getAllPolls } from '@/services/pollsService';
import { AdminPollsList } from './_components/AdminPollsList';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';

export const revalidate = 0;

export default async function AdminVotacoesPage() {
    const user = await isAuthenticated();
    if (!user) {
        redirect('/login');
    }

    const { role } = await resolveUserRole({
        uid: user.uid,
        customClaims: user.customClaims as Record<string, any> | undefined,
        fallbackName: user.displayName || user.email || 'Admin',
    });

    if (role !== 'admin') {
        return (
            <div className="p-8">
                <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    const polls = await getAllPolls();

    return (
        <main className="max-w-6xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <AdminHeader
                title="Minivotações e Enquetes"
                subtitle="Crie e gerencie votações para engajar sua base de líderes."
            />
            <div className="p-3 md:p-8 space-y-5 flex-1 flex flex-col">
                <AdminPollsList initialPolls={polls} />
            </div>
        </main>
    );
}
