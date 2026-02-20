import { UserRole } from '@/types/user';

const roleMap: Record<string, UserRole> = {
  admin: 'admin',
  administrador: 'admin',
  administrator: 'admin',
  adm: 'admin',
  leader: 'leader',
  lider: 'leader',
  master: 'leader',
  sub: 'leader',
  member: 'leader',
  candidate: 'leader',
  candidato: 'leader',
  citizen: 'leader',
};

export function normalizeRole(role?: string | null): UserRole {
  const normalizedKey = role?.toLowerCase() ?? '';

  if (normalizedKey in roleMap) {
    return roleMap[normalizedKey];
  }

  return 'member';
}
