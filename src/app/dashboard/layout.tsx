
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { LogoutProvider } from '@/hooks/use-auth';
import { FloatingAiChat } from '@/components/ai/FloatingAiChat';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal para a área autenticada.
 * AGORA COM LÓGICA CONDICIONAL PARA EVITAR DUPLICAÇÃO DE LAYOUT EM PRODUÇÃO.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { loading, user } = useUser();
  const pathname = usePathname();

  // Verifica se a rota atual pertence à seção de administração.
  const isAdminRoute = pathname.startsWith('/dashboard/admin');

  useEffect(() => {
    // Lógica de redirecionamento removida anteriormente.
  }, [user]);

  // Se for uma rota de admin, este layout se torna "transparente",
  // delegando 100% da renderização do layout para o /dashboard/admin/layout.tsx.
  // Isso resolve o problema de duplicação de Header/Sidebar em produção.
  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Renderiza o layout padrão do dashboard para todas as outras rotas.
  return (
    <LogoutProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <FloatingAiChat />
    </LogoutProvider>
  );
}
