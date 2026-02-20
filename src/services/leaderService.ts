
import { Leader } from '@/types/leader';
import api from '@/services/api';

/**
 * Busca todos os líderes.
 * @returns Uma lista de todos os líderes.
 */
export const getLeaders = async (): Promise<Leader[]> => {
  try {
    const response = await api.get('/leaders');
    return response.data;
  } catch (error) {
    console.error('[SERVICE_ERROR] Erro ao buscar líderes:', error);
    throw error;
  }
};

/**
 * Busca líderes por uma cidade específica.
 * @param city - O nome da cidade.
 * @returns Uma lista de líderes da cidade especificada.
 */
export const getLeadersByCity = async (city: string): Promise<Leader[]> => {
  try {
    const response = await api.get(`/leaders?city=${city}`);
    return response.data;
  } catch (error) {
    console.error(`[SERVICE_ERROR] Erro ao buscar líderes da cidade ${city}:`, error);
    throw error;
  }
};

/**
 * Atualiza os dados de um líder.
 * @param data - Os dados a serem atualizados.
 * @returns A resposta da API.
 */
export const updateLeader = async (data: any): Promise<any> => {
  try {
    const response = await api.put('/profile/leader', data);
    return response.data;
  } catch (error) { 
    console.error('[SERVICE_ERROR] Erro ao atualizar o perfil do líder:', error);
    throw error;
  }
};
