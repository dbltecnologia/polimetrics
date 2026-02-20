import { isAuthenticated } from '@/lib/auth/server-side';
import { redirect } from 'next/navigation';
import { resolveUserRole } from '@/lib/user-role';
import { getElections } from '@/services/admin/elections/electionsService';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { ElectionsChart } from './_components/ElectionsChart';
import { ElectionsManager } from './_components/ElectionsManager';

export const revalidate = 0;

export default async function AdminElectionsPage() {
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

    const elections = await getElections();

    return (
        <main className="max-w-6xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <AdminHeader
                title="Histórico de Eleições"
                subtitle="Analise seu desempenho e gerencie registros eleitorais passados."
            />
            <div className="p-3 md:p-8 space-y-6 flex-1 flex flex-col">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="w-full">
                        <ElectionsChart data={elections} />
                    </div>
                    <div className="w-full">
                        <ElectionsManager data={elections} />
                    </div>
                </div>
            </div>
        </main>
    );
}
