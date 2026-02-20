'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Define a forma do contexto de logout
interface LogoutContextType {
  isLoggingOut: boolean;
  handleLogout: () => Promise<void>;
}

// Cria o contexto com um valor padrão
const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

// Define as props para o LogoutProvider
interface LogoutProviderProps {
  children: ReactNode;
}

/**
 * Provedor para a funcionalidade de logout.
 */
export function LogoutProvider({ children }: LogoutProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Limpa o cookie de sessão do servidor
      const serverResponse = await fetch('/api/auth/session', { method: 'DELETE' });
      if (!serverResponse.ok) {
        throw new Error('Falha ao encerrar a sessão do servidor.');
      }

      // 2. Faz o logout do cliente Firebase
      await signOut(auth);

      // 3. Redireciona para a home
      router.push('/');
      
    } catch (error: any) {
      console.error('Erro no processo de logout:', error);
      toast({
        title: 'Erro ao Sair',
        description: error.message || 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <LogoutContext.Provider value={{ isLoggingOut, handleLogout }}>
      {children}
    </LogoutContext.Provider>
  );
}

/**
 * Hook customizado para acessar o contexto de logout.
 * @returns O contexto de logout.
 */
export function useLogout() {
  const context = useContext(LogoutContext);
  if (context === undefined) {
    throw new Error('useLogout deve ser usado dentro de um LogoutProvider');
  }
  return context;
}
