
'use client';

import { useSession } from "@/context/session-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { AddMemberForm } from "@/components/forms/AddMemberForm";

const QuickLink = ({ href, icon: Icon, title, description, isVisible }: any) => {
    if (!isVisible) return null;
    return (
        <Link href={href} className="no-underline">
            <Card className="flex h-full min-h-[130px] flex-col justify-between space-y-2 border ring-1 ring-slate-100 transition hover:scale-[1.01] hover:border-primary/30 hover:ring-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
                    <Icon className="w-5 h-5 text-slate-400" />
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
};


export default function LeaderDashboardClient() {
    const { user, loading } = useSession();
    const { user: profile } = useUser();

    if (loading) {
        return <p>Carregando dashboard...</p>;
    }

    const isAdmin = profile?.role === 'admin';
    const isLeader = profile?.role === 'leader';
    const displayName = profile?.name || user?.displayName || 'Líder';


    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4 md:flex-row md:items-stretch">
                <Card className="flex-1 min-w-0 bg-white/95 shadow-sm shadow-slate-900/5">
                    <CardHeader className="flex justify-between border-b border-slate-100 pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-500">Bem-vindo(a)!</CardTitle>
                        <span className="text-xs text-muted-foreground">Dashboard Líder</span>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-2xl font-bold leading-snug break-words">{displayName}</p>
                        <p className="text-sm text-muted-foreground">
                            Acompanhe suas ações e gerencie sua base.
                        </p>
                    </CardContent>
                </Card>
                <div className="flex w-full flex-col gap-3 md:w-1/2">
                    <Card className="flex-1 bg-slate-50 px-5 py-4 shadow-inner shadow-slate-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-600">Sua base</p>
                            <span className="text-xs text-muted-foreground">Atualizado agora</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-primary tracking-tight">—</p>
                        <p className="text-xs text-muted-foreground">Sem dados recentes</p>
                    </Card>
                    <Card className="flex-1 bg-slate-50 px-5 py-4 shadow-inner shadow-slate-200">
                        <p className="text-sm font-semibold text-slate-600">Próximos passos</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Verifique os membros da sua base e mantenha tudo atualizado.
                        </p>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-semibold">Acesso Rápido</h2>
                        <p className="text-sm text-muted-foreground">
                            Acompanhe as ações com atalhos rápidos para cada etapa da sua jornada.
                        </p>
                    </div>
                    <Button variant="outline" asChild size="sm" className="self-start">
                        <Link href="/dashboard/leader-panel" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Minha Rede
                        </Link>
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">

                    <QuickLink
                        href="/dashboard/admin/users"
                        icon={Users}
                        title="Gerenciar Usuários"
                        description="Administre as funções e acesso dos usuários."
                        isVisible={isAdmin}
                    />
                </div>
            </section>

            {profile?.role === 'leader' && profile?.leader?.cityId && (
                <section className="border rounded-2xl bg-white p-6 shadow">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-semibold">Cadastrar novo membro</h2>
                        <p className="text-sm text-muted-foreground">
                            Registre um apoiador e vincule-o automaticamente à sua base.
                        </p>
                    </div>
                    <div className="mt-4">
                        <AddMemberForm
                            leaderId={profile.leader.id}
                            cityId={profile.leader.cityId}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}
