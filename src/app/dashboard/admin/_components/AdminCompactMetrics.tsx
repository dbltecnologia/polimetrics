import { Calendar, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { getAdminCompactMetrics } from "@/services/admin/getAdminCompactMetrics";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MetricItem = {
  key: string;
  label: string;
  icon: any;
  href?: string;
};

const items: MetricItem[] = [
  { key: "meetingsToday", label: "Reuniões hoje", icon: Calendar },
  { key: "openChamados", label: "Demandas em aberto", icon: MessageSquare, href: "/dashboard/admin/chamados" },
];

export async function AdminCompactMetrics() {
  const metrics = await getAdminCompactMetrics();

  return (
    <section className="px-2 md:px-8">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4">
        {items.map(({ key, label, icon: Icon, href }) => {
          const CardContent = (
            <div key={key} className={cn(
              "rounded-xl border bg-card p-2 md:p-3 shadow-sm",
              href && "hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
            )}>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate" title={label}>
                  {label}
                </p>
                <div className="shrink-0 rounded-lg bg-primary/10 p-1.5 md:p-2 text-primary">
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                </div>
              </div>
              <p className="mt-1 text-lg sm:text-xl md:mt-2 md:text-2xl font-bold tracking-tight">
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

