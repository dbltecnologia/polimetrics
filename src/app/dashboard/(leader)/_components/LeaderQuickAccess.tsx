import Link from "next/link";
import { Calendar, MessageSquare, Target, Trophy, UsersRound, UserPlus } from "lucide-react";

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Target },
  { href: "/dashboard/gabinete", label: "Gabinete", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Meu Perfil", icon: UsersRound },
] as const;

export function LeaderQuickAccess() {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Acesso Rápido</h2>
        <p className="text-sm text-muted-foreground">
          Atalhos para as áreas mais usadas do painel.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border bg-background p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-3 text-[11px] font-bold tracking-wide text-foreground uppercase">
              {label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

