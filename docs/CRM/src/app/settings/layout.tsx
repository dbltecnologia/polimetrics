// src/app/settings/layout.tsx
'use client';

import { KeyRound, LifeBuoy, Server, UserCircle } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/settings/profile', label: 'Minha Conta', icon: UserCircle },
  { href: '/settings/instances', label: 'Instâncias', icon: Server },
  { href: '/settings/api-keys', label: 'Chaves de API', icon: KeyRound },
  { href: '/settings/support', label: 'Suporte', icon: LifeBuoy },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas instâncias, chaves e encontre ajuda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <NextLink key={link.href} href={link.href} passHref>
                  <span
                    className={cn(
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <link.icon className="mr-3 h-5 w-5" />
                    <span>{link.label}</span>
                  </span>
                </NextLink>
              );
            })}
          </nav>
        </aside>
        <div className="md:col-span-3">{children}</div>
      </div>
    </main>
  );
}
