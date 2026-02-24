import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  Trophy,
  LogOut,
  FileText,
  Vote,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';
import { useLogout } from '@/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';

const STATE_LABELS: Record<string, string> = {
  SP: 'São Paulo',
  RJ: 'Rio de Janeiro',
  MG: 'Minas Gerais',
  PR: 'Paraná',
  DF: 'Distrito Federal',
  BA: 'Bahia',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  CE: 'Ceará',
  PE: 'Pernambuco',
  GO: 'Goiás',
  PA: 'Pará',
  MA: 'Maranhão',
  OUTRO: 'Outro Estado',
};

function getStateCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|; )polimetrics_state=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

type AdminMetrics = {
  meetingsToday: number;
  leadersActiveToday: number;
  openChamados: number;
  pendingValidations: number;
};

const mainLinks = [
  { name: 'Dashboard Político', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Mapa Político', href: '/dashboard/admin/mapa-politico', icon: Target },
  { name: 'Líderes Políticos', href: '/dashboard/admin/leaders', icon: Users },
  { name: 'Chamados', href: '/dashboard/admin/chamados', icon: FileText },
  { name: 'Minivotações', href: '/dashboard/admin/votacoes', icon: Vote },
  { name: 'Eleições e Análise', href: '/dashboard/admin/eleicoes', icon: TrendingUp },
];


interface AdminSidebarProps {
  variant?: 'desktop' | 'mobile';
}

export function AdminSidebar({ variant = 'desktop' }: AdminSidebarProps) {
  const pathname = usePathname();
  const { handleLogout, isLoggingOut } = useLogout();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelectedState(getStateCookie());
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setMetrics(data);
      })
      .catch(() => {
        if (!active) return;
        setMetrics(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const badgeByHref = useMemo(() => {
    if (!metrics) return {};
    return {
      '/dashboard/admin/chamados': metrics.openChamados,
    } as Record<string, number>;
  }, [metrics]);

  const renderLink = (link: { name: string; href: string; icon: React.ElementType }) => (
    <Link
      key={link.name}
      href={link.href}
      className={clsx(
        'flex items-center gap-3 rounded-md px-3 py-3 text-neutral-white/80 transition-all hover:bg-primary-dark hover:text-neutral-white',
        {
          'bg-primary-dark text-neutral-white font-semibold': pathname === link.href,
        }
      )}
    >
      <link.icon className="h-5 w-5" />
      <span className="flex-1">{link.name}</span>
      {typeof badgeByHref[link.href] === 'number' && badgeByHref[link.href] > 0 && (
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-neutral-white">
          {badgeByHref[link.href]}
        </span>
      )}
    </Link>
  );

  return (
    <aside
      className={clsx(
        'h-full flex-col bg-primary border-r border-primary-dark',
        variant === 'desktop' ? 'hidden md:flex' : 'flex'
      )}
    >
      <div className="flex h-20 items-center border-b border-primary-dark px-6">
        <Link href="/dashboard/admin" className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shadow-sm flex items-center justify-center">
            <Image src="/PoliMetrics.png" alt="Logo PoliMetrics" width={32} height={32} className="object-contain mix-blend-multiply" />
          </div>
          <span className="text-xl font-bold text-neutral-white tracking-wide">PoliMetrics</span>
        </Link>
      </div>

      {/* Badge do estado atual */}
      {selectedState && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-sky-500/20 border border-sky-400/30 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-sky-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300/80">Estado atual</p>
            <p className="truncate text-xs font-bold text-neutral-white">{STATE_LABELS[selectedState] ?? selectedState}</p>
          </div>
          <span className="ml-auto shrink-0 rounded bg-sky-400/30 px-1.5 py-0.5 text-[11px] font-black text-sky-200">{selectedState}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="space-y-3">
          {metrics && (
            <div className="rounded-xl bg-primary-dark/60 p-3 text-neutral-white/90">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-white/70">
                Hoje
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <p className="text-neutral-white/70">Reuniões</p>
                  <p className="text-base font-bold">{metrics.meetingsToday}</p>
                </div>
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <p className="text-neutral-white/70">Líderes ativos</p>
                  <p className="text-base font-bold">{metrics.leadersActiveToday}</p>
                </div>
              </div>
            </div>
          )}
          <ul className="space-y-1">
            {mainLinks.map((link) => (
              <li key={link.name}>{renderLink(link)}</li>
            ))}
          </ul>
        </nav>
        <nav>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-neutral-white/80 transition-all hover:bg-primary-dark hover:text-neutral-white"
                disabled={isLoggingOut}
              >
                <LogOut className="h-5 w-5" />
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
