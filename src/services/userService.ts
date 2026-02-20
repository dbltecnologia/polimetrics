
import { User } from '@/types/user';
import api from './api';

/**
 * Busca o perfil do usuário autenticado.
 * ESSA FUNÇÃO FOI DESTRUÍDA E AGORA ESTÁ SENDO RESTAURADA.
 * É essencial para o UserContext funcionar.
 * @returns Os dados do perfil do usuário.
 */
export const fetchUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Sem sessão ou bloqueado: trate como não autenticado sem alarde
      return null;
    }
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Erro ao buscar o perfil do usuário.';
    console.error('[SERVICE_ERROR] Erro ao buscar o perfil do usuário:', message);
    throw new Error(message);
  }
};
