
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { AdminSidebar } from './_components/AdminSidebar';
import Header from '@/components/layout/header';
import { LogoutProvider } from '@/hooks/use-auth';
import { FloatingAiChat } from '@/components/ai/FloatingAiChat';

/**
 * Layout da seção de Administração.
 * ESTE ARQUIVO É O CORAÇÃO DO PROBLEMA. A lógica de autenticação foi apagada e está sendo restaurada.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e o usuário não existe ou não é um admin,
    // redireciona para a página de login.
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Enquanto o UserContext estiver carregando o usuário, exibe a mensagem.
  // ESTA É A FONTE DA MENSAGEM "Redirecionando...".
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-lg">
        Redirecionando para o painel...
      </div>
    );
  }

  // Se o carregamento terminou e o usuário é um admin, renderiza o layout completo.
  if (user && user.role === 'admin') {
    return (
      <LogoutProvider>
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-card lg:block">
            <AdminSidebar />
          </div>
          <div className="flex min-w-0 flex-col">
            <Header />
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-muted p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
        <FloatingAiChat />
      </LogoutProvider>
    );
  }

  // Se não estiver carregando e o usuário não for um admin, não renderiza nada
  // enquanto o redirecionamento acontece.
  return null;
}
