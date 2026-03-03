import { getMemberById } from '@/services/admin/members/getMemberById';
import { getLeaders } from '@/services/admin/getLeaders';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { MemberEditForm } from './_components/MemberEditForm';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MemberEditPage(props: { params: Promise<{ memberId: string }> }) {
    const params = await props.params;
    const [member, leaders, cities] = await Promise.all([
        getMemberById(params.memberId),
        getLeaders(),
        getAllCities(),
    ]);

    if (!member) {
        notFound();
    }

    return (
        <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/admin/members`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Editar Membro</h1>
                    <p className="text-sm text-muted-foreground">{(member as any).name}</p>
                </div>
            </div>

            <MemberEditForm member={member as any} leaders={leaders} cities={cities} />
        </main>
    );
}
