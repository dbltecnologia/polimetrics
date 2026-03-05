import { getMemberById } from '@/services/admin/members/getMemberById';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import { isAuthenticated } from '@/lib/auth/server-side';
import { redirect, notFound } from 'next/navigation';
import { MemberEditForm } from '@/app/dashboard/admin/members/[memberId]/edit/_components/MemberEditForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderMemberEditPage(props: { params: Promise<{ memberId: string }> }) {
    const user = await isAuthenticated();
    if (!user) redirect('/login');

    const params = await props.params;
    const [member, cities] = await Promise.all([
        getMemberById(params.memberId),
        getAllCities(),
    ]);

    if (!member) notFound();

    return (
        <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/leader-panel">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Editar Apoiador</h1>
                    <p className="text-sm text-muted-foreground">{(member as any).name}</p>
                </div>
            </div>

            <MemberEditForm member={member as any} leaders={[]} cities={cities} hideLeaderField redirectTo="/dashboard/leader-panel" />
        </main>
    );
}
