
export type UserRole = 'admin' | 'leader' | 'member' | 'citizen' | 'master' | 'sub' | 'blocked' | 'lider';

export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  role: UserRole;
  instagram?: string;
  facebook?: string;
  createdAt?: string;
  profile?: {
    isProfileComplete?: boolean;
    [key: string]: any;
  };
  leader?: {
    id: string;
    cityId?: string;
    [key: string]: any;
  };
}

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  instagram?: string;
  facebook?: string;
  createdAt?: string;
  phone?: string;
  cityId?: string;
  parentLeaderId?: string | null;
  lat?: number;
  lng?: number;
  bairro?: string;
  areaAtuacao?: string;
  influencia?: string;
  status?: string;
  [key: string]: any;
}
