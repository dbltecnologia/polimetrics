
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/server-side";
import { resolveUserRole } from "@/lib/user-role";
import { LeaderCompactMetrics } from "./_components/LeaderCompactMetrics";
import { LeaderQuickAccess } from "./_components/LeaderQuickAccess";
import { AddMemberForm } from "@/components/forms/AddMemberForm";
import { getLeaderProfile } from "@/services/leader/getLeaderProfile";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
        <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Cadastrar apoiador</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre um novo apoiador vinculado à sua base.
            </p>
          </div>
          <div className="mt-4">
            {resolvedCityId ? (
              <AddMemberForm leaderId={leader?.id || user.uid} cityId={resolvedCityId} />
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
