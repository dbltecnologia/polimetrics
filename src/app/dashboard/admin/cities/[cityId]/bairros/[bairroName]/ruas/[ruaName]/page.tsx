import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { firestore } from '@/lib/firebase-admin';
import { getCityById } from '@/services/admin/cities/getCityById';
import { ChevronLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import MembersAdminTable from '@/components/admin/members/MembersAdminTable';

export const revalidate = 0;

interface MemberMapping {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    leaderName: string;
    status: 'ativo' | 'inativo' | 'potencial';
    cityName?: string | null;
    votePotential?: number;
}

async function getStreetMembers(cityId: string, bairroName: string, ruaName: string): Promise<MemberMapping[]> {
    const snapshot = await firestore
        .collection('members')
        .where('cityId', '==', cityId)
        .where('neighborhood', '==', bairroName)
        .where('street', '==', ruaName)
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Sem Nome',
            phone: data.phone || null,
            address: `${data.street || ''}, ${data.number || 'S/N'} - ${data.neighborhood || ''}`,
            leaderName: data.leaderName || 'Sem Líder',
            status: data.status || 'ativo',
            cityName: data.cityName || null,
            votePotential: Number(data.votePotential) || 0
        } as MemberMapping;
    });
}

export default async function ViewStreetPage({ params }: { params: Promise<{ cityId: string; bairroName: string; ruaName: string }> }) {
    const { cityId, bairroName: rawBairro, ruaName: rawRua } = await params;
    const bairroName = decodeURIComponent(rawBairro);
    const ruaName = decodeURIComponent(rawRua);

    const city = await getCityById(cityId);

    if (!city) {
        return (
            <main className="p-6 md:p-8">
                <AdminHeader title="Cidade não encontrada" subtitle="Verifique o ID informado." />
            </main>
        );
    }

    const members = await getStreetMembers(cityId, bairroName, ruaName);

    return (
        <main>
            <AdminHeader
                title={`Apoiadores na Rua: ${ruaName}`}
                subtitle={`Bairro ${bairroName} - ${city.name}/${city.state}`}
            >
                <Link
                    href={`/dashboard/admin/cities/${cityId}/bairros/${encodeURIComponent(bairroName)}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:-translate-y-[1px] hover:border-primary/40 hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar para o Bairro
                </Link>
            </AdminHeader>

            <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Residentes Mapeados
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Mostrando {members.length} residente(s) filtrado(s) por esta rua.
                        </p>
                    </div>
                </div>

                {members.length > 0 ? (
                    <MembersAdminTable members={members} />
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
                        Nenhum apoiador encotrado especificamente nesta rua com estes dados cadastrais.
                    </div>
                )}
            </div>
        </main>
    );
}
