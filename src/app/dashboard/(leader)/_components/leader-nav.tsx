'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, CalendarClock, Trophy, User, FileText, CheckSquare } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/leader-panel', label: 'Minha Rede', icon: Users },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
];

export function LeaderSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary',
            pathname === link.href && 'bg-muted text-primary'
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function LeaderMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto border-b bg-card px-3 py-3 lg:hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground',
            pathname === link.href && 'border-primary bg-primary/10 text-primary'
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
