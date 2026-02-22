import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import { getCityById } from '@/services/admin/cities/getCityById';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import MembersAdminTable from '@/components/admin/members/MembersAdminTable';
import { Member } from '@/services/admin/members/getAllMembers';

export const revalidate = 0;

async function getMembersByStreet(cityId: string, neighborhoodName: string, streetName: string) {
    const snapshot = await firestore
        .collection('members')
        .where('cityId', '==', cityId)
        .where('neighborhood', '==', neighborhoodName)
        .get();

    const allMembers = snapshot.docs.map((doc) => {
        const data = doc.data() as Member;
        return { ...data, id: doc.id };
    });

    if (streetName === 'Rua Não Informada') {
        return allMembers.filter(m => !m.street || m.street.trim() === '');
    }

    return allMembers.filter(m => m.street === streetName);
}

export default async function ViewStreetPage({ params }: { params: Promise<{ cityId: string, neighborhoodName: string, streetName: string }> }) {
    const { cityId, neighborhoodName, streetName } = await params;
    const decodedNeighborhood = decodeURIComponent(neighborhoodName);
    const decodedStreet = decodeURIComponent(streetName);
    const city = await getCityById(cityId);

    if (!city) {
        return (
            <main className="p-6 md:p-8">
                <AdminHeader title="Cidade não encontrada" subtitle="Verifique o ID informado." />
            </main>
        );
    }

    const members = await getMembersByStreet(cityId, decodedNeighborhood, decodedStreet);

    return (
        <main>
            <AdminHeader
                title={`Rua: ${decodedStreet}`}
                subtitle={`Apoiadores locais no bairro ${decodedNeighborhood} (${city.name})`}
            >
                <Link
                    href={`/dashboard/admin/cities/${cityId}/bairros/${neighborhoodName}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar para {decodedNeighborhood}
                </Link>
            </AdminHeader>

            <div className="p-6 md:p-8 pt-0 mt-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Apoiadores na Rua</h3>
                            <p className="text-sm text-muted-foreground">Listagem focada para visitas estruturais e lideranças.</p>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        {members.length > 0 ? (
                            <MembersAdminTable members={members} />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                Nenhum apoiador com registros nesta rua.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
