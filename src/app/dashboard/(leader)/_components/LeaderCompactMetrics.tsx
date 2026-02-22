import { Calendar, Sparkles, UsersRound } from "lucide-react";
import { getLeaderCompactMetrics } from "@/services/leader/getLeaderCompactMetrics";
import Link from "next/link";

export async function LeaderCompactMetrics({ leaderId }: { leaderId: string }) {
  const metrics = await getLeaderCompactMetrics(leaderId);

  const items = [
    { label: "Apoiadores", value: metrics.supportersTotal, icon: UsersRound, href: "/dashboard/leader-panel" },
    { label: "Reuniões hoje", value: metrics.meetingsToday, icon: Calendar, href: "/dashboard/chamados" },
    { label: "Atividades hoje", value: metrics.activitiesToday, icon: Sparkles, href: "/dashboard/chamados" },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {items.map(({ label, value, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          className="rounded-2xl border bg-card p-3 shadow-sm hover:-translate-y-1 hover:shadow-md cursor-pointer transition-all block"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate" title={label}>
              {label}
            </p>
            <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </Link>
      ))}
    </section>
  );
}

