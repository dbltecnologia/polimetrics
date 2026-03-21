// src/app/layout.tsx
'use client';

import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState, useCallback } from 'react';
import { AuthProvider, useAuth, type AppUser } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getFunnels } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from '@/components/theme-provider';

// Import all AI flows at the root to register them with Genkit
import "@/ai";


// O RootLayout agora é o ponto de entrada principal que envolve toda a aplicação.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Agenticx.ia - Automatize seu Negócio com IA</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js" async></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Este componente lida com a lógica de layout e proteção de rotas.
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [funnels, setFunnels] = useState<{ id: string; name: string; recordCount: number }[]>([]);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [activeFunnelName, setActiveFunnelName] = useState<string | null>(null);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  // Páginas públicas que não exigem login
  const isPublicPage = ['/login', '/signup', '/', '/afiliados', '/designer-brief'].includes(pathname);

  // Páginas que NÃO usam o layout do dashboard
  const hasNoDashboardLayout = isPublicPage;

  const refreshFunnels = useCallback(async () => {
    if (user?.uid) {
      try {
        const funnelsResult = await getFunnels(user.uid);
        if (funnelsResult?.data) {
          setFunnels(funnelsResult.data);
        }
      } catch (error) {
        console.error("Erro ao carregar funis:", error);
        // Do not show toast on import page as it's expected to not have a funnel selected
        if (pathname !== '/import' && document.body.contains(document.getElementById('root-layout'))) {
          toast({ title: "Erro", description: "Não foi possível carregar a lista de funis.", variant: "destructive" });
        }
      }
    }
  }, [user?.uid, toast, pathname]);


  useEffect(() => {
    const handleStorageChange = () => {
      const id = sessionStorage.getItem('activeUploadId');
      const name = sessionStorage.getItem('activeFunnelName');
      setActiveFunnelId(id);
      setActiveFunnelName(name);
      // refreshFunnels is now stable due to useCallback, but let's be safe
      // and only call it when needed. A manual call is made on funnel change.
    };

    handleStorageChange(); // Initial load

    const handleFunnelsUpdated = () => refreshFunnels();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('funnels-updated', handleFunnelsUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('funnels-updated', handleFunnelsUpdated);
    };
  }, []); // Empty dependency array means this runs once on mount.

  const handleFunnelChange = useCallback(() => {
    refreshFunnels();
  }, [refreshFunnels]);


  useEffect(() => {
    if (!isLoading && user) {
      refreshFunnels().finally(() => setIsLayoutLoading(false));
    } else {
      setIsLayoutLoading(isLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);


  useEffect(() => {
    if (!isLoading) {
      if (!user && !isPublicPage) {
        router.push('/login');
      } else if (user && !isPublicPage && !user.emailVerified) {
        // Bloqueio extra: Se por algum motivo o AuthContext prover o logado em rota que não seja pública, expulsa
        import('firebase/auth').then(async ({ signOut }) => {
          const { auth } = await import('@/lib/firebase');
          signOut(auth);
        }).catch(() => { });
        router.push('/login');
      } else if (user && user.emailVerified && (pathname === '/login' || pathname === '/signup')) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, isPublicPage, router, pathname]);

  if (isLoading || isLayoutLoading || (!user && !isPublicPage)) {
    return (
      <div id="root-layout" className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (hasNoDashboardLayout) {
    return <div id="root-layout">{children}</div>;
  }

  // Para todas as outras páginas internas do app, renderiza o DashboardLayout.
  return (
    <div id="root-layout">
      <DashboardLayout
        user={user}
        funnels={funnels}
        activeFunnelId={activeFunnelId}
        activeFunnelName={activeFunnelName}
        onFunnelChange={handleFunnelChange}
      >
        {children}
      </DashboardLayout>
    </div>
  );
};
