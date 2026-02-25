import { getLeaders } from '@/services/admin/getLeaders';
import { getAllMembers } from '@/services/admin/members/getAllMembers';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { MapClient } from './_components/MapClient';

export const revalidate = 0;

export default async function MapaPoliticoPage() {
    const [rawLeaders, members, cities] = await Promise.all([
        getLeaders(),
        getAllMembers(),
        getAllCities()
    ]);

    const cityById = new Map(cities.map(c => [c.id, `${c.name} - ${c.state}`]));

    const leaders = rawLeaders.map(leader => ({
        ...leader,
        cityName: leader.cityId ? (cityById.get(leader.cityId) || null) : null
    }));

    return (
        <main className="max-w-6xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <AdminHeader
                title="Mapa Político"
                subtitle="Visualize a distribuição estratégica da sua base por bairros."
            />
            <div className="p-2 md:p-8 space-y-4 flex-1 flex flex-col pt-4 md:pt-4">
                <MapClient leaders={leaders} members={members} />
            </div>
        </main>
    );
}
