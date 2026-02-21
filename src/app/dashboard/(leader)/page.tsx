
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/server-side";
import { resolveUserRole } from "@/lib/user-role";
import { LeaderCompactMetrics } from "./_components/LeaderCompactMetrics";
import { LeaderQuickAccess } from "./_components/LeaderQuickAccess";
import { Button } from "@/components/ui/button";
import { getLeaderProfile } from "@/services/leader/getLeaderProfile";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await isAuthenticated();
  if (!user) redirect("/login");

  const { role, name, leader } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || "Líder",
  });

  const leaderProfile = role === "leader" ? await getLeaderProfile(user.uid).catch(() => null) : null;
  const resolvedCityIdRaw =
    (leaderProfile as any)?.cityId ??
    (leaderProfile as any)?.city ??
    (leaderProfile as any)?.cidadeId ??
    (leader as any)?.cityId ??
    "";
  const resolvedCityId = typeof resolvedCityIdRaw === "string" ? resolvedCityIdRaw.trim() : "";

  return (
    <div className="p-3 md:p-8 space-y-6">
      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão rápida do seu dia e atalhos para as áreas principais.
        </p>
      </section>

      <LeaderCompactMetrics leaderId={user.uid} />

      <LeaderQuickAccess />

      {role === "leader" && (
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6 border-primary/20 bg-primary/5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Expandir sua Rede
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie sua base de contatos, avalie seu potencial de votos e adicione novos apoiadores lado a lado na sua lista.
            </p>
          </div>
          <div className="mt-4">
            {resolvedCityId ? (
              <Button asChild>
                <Link href="/dashboard/leader-panel">
                  Acessar Minha Rede e Cadastrar
                </Link>
              </Button>
            ) : (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                Complete o cadastro da sua cidade em{" "}
                <Link href="/dashboard/profile" className="font-semibold text-primary underline">
                  Perfil do Líder
                </Link>{" "}
                para liberar o botão de cadastro.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
