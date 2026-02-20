import { LucideProps } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  description?: string;
}

export function AdminStatCard({ title, value, icon: Icon, description }: AdminStatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        <div className="rounded-lg bg-blue-50 p-1.5">
            <Icon className="h-5 w-5 text-blue-700" />
        </div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {description && <p className="mt-1 text-xs text-gray-500 line-clamp-1">{description}</p>}
      </div>
    </div>
  );
}
