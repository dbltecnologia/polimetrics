import { Calendar, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { getAdminCompactMetrics } from "@/services/admin/getAdminCompactMetrics";
import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { key: "meetingsToday", label: "Reuniões hoje", icon: Calendar, href: "/dashboard/admin/meetings" },
  { key: "openChamados", label: "Demandas em aberto", icon: MessageSquare, href: "/dashboard/admin/chamados" },
] as const;

export async function AdminCompactMetrics() {
  const metrics = await getAdminCompactMetrics();

  return (
    <section className="px-3 md:px-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
        {items.map(({ key, label, icon: Icon, href }) => {
          const CardContent = (
            <div key={key} className={cn(
              "rounded-2xl border bg-card p-3 shadow-sm",
              href && "hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
            )}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate" title={label}>
                  {label}
                </p>
                <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {metrics[key as keyof typeof metrics]}
              </p>
            </div>
          );

          return href ? (
            <Link key={key} href={href} className="block">

              {CardContent}

            </Link>
          ) : CardContent;
        })}
      </div>
    </section>
  );
}

