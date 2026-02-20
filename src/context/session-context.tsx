'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Representa o usuário COMPLETO retornado pelo servidor,
 * contendo todos os campos usados no dashboard.
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;

  role?: string;
  experience?: string;
  cityId?: string;
  instagram?: string;
  facebook?: string;
}

interface SessionContextValue {
  user: AppUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 🔥 Pega os dados COMPLETOS da sessão armazenada no backend.
   */
  const fetchServerSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });

      if (!res.ok) {
        console.warn('[session-context] Nenhuma sessão válida no backend.');
        return null;
      }

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (!text) return null;

      // Evita tentar parsear HTML de redirecionamento/login
      if (!contentType.includes('application/json') || !text.trim().startsWith('{')) {
        console.error('[session-context] Resposta não era JSON:', text.slice(0, 200));
        return null;
      }

      const data = JSON.parse(text);
      if (!data) return null;

      // A API /api/auth/me retorna { id, name, email, role, leader }
      if (data.id || data.email) {
        return {
          uid: data.id,
          email: data.email ?? null,
          displayName: data.name ?? null,
          role: data.role,
          // compat: se houver mais campos adicionamos aqui
        } as AppUser;
      }

      // Fallback para estrutura antiga { user: { ... } }
      return data.user as AppUser;
    } catch (err) {
      console.error('[session-context] Erro ao buscar sessão no backend:', err);
      return null;
    }
  }, []);

  /**
   * 🔥 Sincroniza Firebase Auth → Backend Session → AppUser completo
   */
  const handleAuthStateChanged = useCallback(async (authUser: FirebaseUser | null) => {
    try {
        if (authUser) {
            const idToken = await authUser.getIdToken();

            await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
            });

            const serverUser = await fetchServerSession();

            setUser(serverUser || {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
            });

        } else {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
        }
    } catch (error) {
        console.error('Erro no handleAuthStateChanged:', error);
        setUser(null);
    } finally {
        setLoading(false);
    }
  }, [fetchServerSession]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  const value = useMemo(() => ({
    user,
    loading,
  }), [user, loading]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}
