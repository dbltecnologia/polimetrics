'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assumindo que você usa o componente Button do Shadcn

const navItems = [
  { href: '/dashboard/leader', label: 'Líder Dashboard' },
  { href: '/dashboard/admin', label: 'Admin Dashboard' },
  { href: '/dashboard/content/create', label: 'CMS (Criar Conteúdo)' },
  { href: '/dashboard/register/new-citizen', label: 'Cadastro Cidadão' },
  // Exemplo de acesso a detalhes (IDs fictícias para teste)
  { href: '/dashboard/citizen/j123', label: 'Detalhe Cidadão (Teste ID)' },
];

export function TestNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50 overflow-x-auto">
      <span className="font-semibold text-sm mr-2 text-gray-700">Test Nav:</span>
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? 'default' : 'outline'}
          asChild
          size="sm"
          className="text-xs"
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  );
}
