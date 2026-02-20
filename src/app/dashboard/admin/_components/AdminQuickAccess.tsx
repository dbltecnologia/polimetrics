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
  { href: "/dashboard/admin/missions", label: "Comando Central", icon: Target },
  { href: "/dashboard/admin/ranking", label: "Engajamento", icon: Trophy },
  { href: "/dashboard/admin/ai", label: "Painel IA", icon: Bot },
];

export function AdminQuickAccess() {
  return (
    <section className="px-3 md:px-8">
      <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Acesso Rápido</h2>
          <p className="text-sm text-muted-foreground">
            Atalhos para as áreas mais usadas do painel.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border bg-background p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold tracking-wide text-foreground">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
