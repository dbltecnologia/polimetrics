import { Calendar, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { getAdminCompactMetrics } from "@/services/admin/getAdminCompactMetrics";

const items = [
  { key: "meetingsToday", label: "Reuniões hoje", icon: Calendar },
  { key: "openChamados", label: "Demandas em aberto", icon: MessageSquare },
] as const;

export async function AdminCompactMetrics() {
  const metrics = await getAdminCompactMetrics();

  return (
    <section className="px-3 md:px-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        {items.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-2xl border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {metrics[key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

