'use client';

import Link from 'next/link';
import { Medal, Users, Home, User, BarChart, FileText } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

// Componente para um item de navegação
const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => (
  <Link
    href={href}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-gray-100"
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
);

// Componente para o cabeçalho da seção da barra lateral
const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="px-3 mt-4 mb-1 text-xs font-semibold text-muted-foreground">{title}</h3>
);

export function Sidebar() {
  // Acessa o objeto de usuário completo e o status de carregamento do contexto.
  const { user, loading } = useUser();

  // Se os dados do usuário ainda estiverem carregando, exibe um estado de carregamento.
  if (loading) {
    return (
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Medal className="h-6 w-6 text-[#FF9345]" />
              <span className="font-bold text-lg">A Votz</span>
            </Link>
          </div>
          <div className="flex-1 py-2">
            <p className="p-4 text-sm text-muted-foreground">Carregando menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Medal className="h-6 w-6 text-[#FF9345]" />
            <span className="font-bold text-lg">A Votz</span>
          </Link>
        </div>
        <div className="flex-1 py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem href="/dashboard" icon={Home} label="Início" />

            {/* Menus para Admin e Líder (Verificação em tempo real) */}
            {user?.role === 'admin' ? (
              <>
                <SectionHeader title="GESTÃO" />
                <NavItem href="/dashboard/admin/leaders" icon={Users} label="Gerenciar Líderes" />
              </>
            ) : (
              <>
                <SectionHeader title="LIDERANÇA" />
                <NavItem href="/dashboard/lider" icon={Users} label="Gerenciar Comunidade" />
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <NavItem href="/dashboard/profile" icon={User} label="Meu Perfil" />
        </div>
      </div>
    </div>
  );
}
