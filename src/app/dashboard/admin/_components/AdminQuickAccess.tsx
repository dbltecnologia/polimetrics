import Link from "next/link";
import {
  Building2,
  Users,
  UsersRound,
  MessageSquareText,
  Target,
  Trophy,
  Bot,
} from "lucide-react";

const quickLinks = [
  { href: "/dashboard/admin/cities", label: "Cidades", icon: Building2 },
  { href: "/dashboard/admin/leaders", label: "Líderes", icon: Users },
  { href: "/dashboard/admin/members", label: "Apoiadores", icon: UsersRound },
  { href: "/dashboard/admin/chamados", label: "Demandas", icon: MessageSquareText },
  { href: "/dashboard/admin/mapa-politico", label: "Mapa Político", icon: Target },
  { href: "/dashboard/admin/eleicoes", label: "Eleições", icon: Trophy },
];

export function AdminQuickAccess() {
  return (
    <section className="px-2 md:px-8">
      <div className="rounded-2xl border bg-card p-3 shadow-sm md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Acesso Rápido</h2>
          <p className="text-sm text-muted-foreground">
            Atalhos para as áreas mais usadas do painel.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center group rounded-2xl border bg-background p-2 sm:p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">

              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <p className="mt-2 text-xs sm:text-sm font-semibold tracking-tight text-foreground leading-tight">
                {label}
              </p>

            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
