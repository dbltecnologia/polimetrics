'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Target,
  Trophy,
  LogOut,
  Building,
  FileText,
  Vote,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import { useLogout } from '@/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';

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
          <Image src="/Logo.png" alt="Logo Mapa Político" width={40} height={40} />
          <span className="text-xl font-bold text-neutral-white">Mapa Político</span>
        </Link>
      </div>
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
