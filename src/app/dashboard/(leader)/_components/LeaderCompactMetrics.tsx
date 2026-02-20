import { Calendar, Sparkles, UsersRound } from "lucide-react";
import { getLeaderCompactMetrics } from "@/services/leader/getLeaderCompactMetrics";

export async function LeaderCompactMetrics({ leaderId }: { leaderId: string }) {
  const metrics = await getLeaderCompactMetrics(leaderId);

  const items = [
    { label: "Apoiadores", value: metrics.supportersTotal, icon: UsersRound },
    { label: "Reuniões hoje", value: metrics.meetingsToday, icon: Calendar },
    { label: "Atividades hoje", value: metrics.activitiesToday, icon: Sparkles },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      ))}
    </section>
  );
}

