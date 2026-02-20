
import { Timestamp } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  cep?: string;
  address?: string;
  birthdate?: string;
  experience: string;
  votePotential: number;
  cityId: string;
  bairro?: string;
  leaderId: string;
  nascimento?: string;
  instagram?: string;
  facebook?: string;
  createdAt: Timestamp;
}
