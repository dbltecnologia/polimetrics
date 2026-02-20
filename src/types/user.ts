
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
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  instagram?: string;
  facebook?: string;
  createdAt?: string;
  [key: string]: any;
}
