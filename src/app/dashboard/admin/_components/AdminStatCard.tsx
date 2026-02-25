import { LucideProps } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  description?: string;
  href?: string;
}

export function AdminStatCard({ title, value, icon: Icon, description, href }: AdminStatCardProps) {
  const CardContainer = (
    <div className={cn(
      "rounded-xl border bg-white p-2 md:p-4 shadow-sm h-full flex flex-col justify-between",
      href && "hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
    )}>
      <div className="flex items-center justify-between gap-1 md:gap-2">
        <h3 className="text-[9px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 truncate" title={title}>{title}</h3>
        <div className="shrink-0 rounded-lg bg-blue-50 p-1 md:p-1.5">
          <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-700" />
        </div>
      </div>
      <div className="mt-1 md:mt-2">
        <p className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {description && <p className="mt-0 text-[9px] md:text-xs text-gray-500 line-clamp-1">{description}</p>}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">

      {CardContainer}

    </Link>
  ) : (
    CardContainer
  );
}
