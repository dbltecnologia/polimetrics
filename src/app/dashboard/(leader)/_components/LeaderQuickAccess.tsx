import Link from "next/link";
import { Calendar, MessageSquare, Target, Trophy, UsersRound, UserPlus } from "lucide-react";

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Target },
  { href: "/dashboard/chamados", label: "Gabinete", icon: MessageSquare },
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
            className="flex flex-col items-center justify-center group rounded-2xl border bg-background p-2 sm:p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">

            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-bold tracking-tight text-foreground uppercase leading-tight">
              {label}
            </p>

          </Link>
        ))}
      </div>
    </section>
  );
}

