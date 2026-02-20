import { isAuthenticated } from '@/lib/auth/server-side';
import { redirect } from 'next/navigation';
import { getChamadosByLeader } from '@/services/chamadosService';
import { getActivePolls } from '@/services/pollsService';
import { GabineteTabs } from './_components/GabineteTabs';
import { Users2 } from 'lucide-react';

export const revalidate = 0;

export default async function GabineteVirtualPage() {
    const user = await isAuthenticated();
    if (!user) redirect('/login');

    const [chamados, polls] = await Promise.all([
        getChamadosByLeader(user.uid),
        getActivePolls()
    ]);

    return (
        <div className="p-3 md:p-8 space-y-6">
            <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comunicação Direta</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">Gabinete Virtual</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Envie propostas, acompanhe suas demandas e participe das decisões através de minivotações.
                    </p>
                </div>
                <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users2 className="h-8 w-8" />
                </div>
            </section>

            <section>
                <GabineteTabs chamados={chamados} polls={polls} userId={user.uid} />
            </section>
        </div>
    );
}
