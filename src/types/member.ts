
import { Timestamp } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  cep?: string;
  address?: string;
  street?: string;
  neighborhood?: string;
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
  // Geolocation — populated by geocoding on save (never entered manually)
  lat?: number | null;
  lng?: number | null;
}
