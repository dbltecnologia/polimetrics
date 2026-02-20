
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { fetchUserProfile } from '@/services/userService';
import { normalizeRole } from '@/lib/role-utils';

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

/**
 * O UserProvider é responsável por gerenciar o estado do usuário na aplicação.
 * ESTE ARQUIVO FOI DESTRUÍDO E SUA LÓGICA ESTÁ SENDO RESTAURADA.
 * A falha em atualizar o estado 'loading' estava causando o loop de redirecionamento infinito.
 */
export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const userProfile = await fetchUserProfile();
    if (!userProfile) {
      setUser(null);
      return;
    }
    setUser({
      ...userProfile,
      role: normalizeRole(userProfile.role),
    });
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const userProfile = await fetchUserProfile();
        if (!isMounted) return;
        if (!userProfile) {
          setUser(null);
        } else {
          setUser({
            ...userProfile,
            role: normalizeRole(userProfile.role),
          });
        }
      } catch (error) {
        console.error('Falha ao buscar o perfil do usuário:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error('Erro ao remover sessão no logout:', error);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};
