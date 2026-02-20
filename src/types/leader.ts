
import { User } from './user';

// Define a estrutura de dados para um Líder
export interface Leader {
  id: string;
  userId: string;
  user: User;
  name?: string;
  cityId?: string;
  politicalParty?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  avatarUrl?: string;
  role?: string;
  cpf?: string;
  bairro?: string;
  areaAtuacao?: string;
  influencia?: 'Baixo' | 'Médio' | 'Alto';
  lat?: number;
  lng?: number;
}

/**
 * Define a estrutura de dados para a atualização de um líder.
 * Este tipo foi restaurado para corrigir o erro de compilação em leaderService.
 * Ele inclui campos que podem ser modificados no perfil do líder.
 */
export interface LeaderUpdateData {
  name?: string;
  politicalParty?: string;
  bio?: string;
  role?: string;
  cityId?: string;
  instagram?: string;
  facebook?: string;
  avatarUrl?: string;
  cpf?: string;
  bairro?: string;
  areaAtuacao?: string;
  influencia?: 'Baixo' | 'Médio' | 'Alto';
  lat?: number;
  lng?: number;
}
