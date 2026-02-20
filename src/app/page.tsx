
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/session-context';
import { Loader2 } from 'lucide-react';

/**
 * Página Raiz (Carregamento e Redirecionamento)
 * 
 * Esta página serve como o ponto de entrada principal da aplicação. Sua única responsabilidade
 * é verificar o estado da sessão do usuário e redirecioná-lo para a rota apropriada:
 * - Se o usuário estiver autenticado -> /dashboard
 * - Se o usuário não estiver autenticado -> /login
 * 
 * Isso centraliza a lógica de redirecionamento e garante que os usuários sempre comecem
 * na tela correta, evitando flashes de conteúdo inadequado.
 */
export default function RootPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Apenas redireciona quando o carregamento da sessão estiver concluído.
    if (!loading) {
      if (user) {
        // Redireciona para o welcome, que decide admin/leader.
        router.replace('/welcome');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Exibe um indicador de carregamento universal enquanto a sessão é verificada.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-4 text-lg text-muted-foreground">Carregando sessão...</p>
    </div>
  );
}
