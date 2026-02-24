import { getLeaders } from '@/services/admin/getLeaders';
import { getAllMembers } from '@/services/admin/members/getAllMembers';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { MapClient } from './_components/MapClient';

export const revalidate = 0;

export default async function MapaPoliticoPage() {
    const [leaders, members] = await Promise.all([
        getLeaders(),
        getAllMembers()
    ]);

    return (
        <main className="max-w-6xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <AdminHeader
                title="Mapa Político Georreferenciado"
                subtitle="Visualize a distribuição estratégica da sua base por bairros."
            />
            <div className="p-3 md:p-8 space-y-5 flex-1 flex flex-col pt-0">
                <MapClient leaders={leaders} members={members} />
            </div>
        </main>
    );
}
