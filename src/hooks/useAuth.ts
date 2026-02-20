'use client';

import { useState, useEffect } from 'react';
import { AppUser } from '@/types/user';

// A interface que descreve o estado de autenticação que o hook retorna.
interface AuthState {
  user: AppUser | null; // O objeto do usuário se autenticado, caso contrário, nulo.
  loading: boolean;      // Verdadeiro enquanto a sessão está sendo buscada, falso depois.
  isAuthenticated: boolean; // Verdadeiro se o usuário estiver autenticado.
}

/**
 * Hook customizado para gerenciar o estado de autenticação no lado do cliente.
 * Ele busca os dados da sessão do usuário a partir do nosso endpoint de API customizado.
 *
 * @returns {AuthState} Um objeto contendo o usuário, o estado de carregamento e o status da autenticação.
 */
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        // Busca os dados da sessão da nossa rota de API dedicada.
        const response = await fetch('/api/auth/session');

        if (response.ok) {
          const user = await response.json();
          setAuthState({ user, loading: false, isAuthenticated: true });
        } else {
          // O usuário não está autenticado (a resposta não foi bem-sucedida).
          setAuthState({ user: null, loading: false, isAuthenticated: false });
        }
      } catch (error) {
        console.error('Falha ao buscar a sessão:', error);
        setAuthState({ user: null, loading: false, isAuthenticated: false });
      }
    }

    fetchSession();
  }, []); // O array de dependências vazio garante que isso seja executado apenas uma vez, na montagem do componente.

  return authState;
}
