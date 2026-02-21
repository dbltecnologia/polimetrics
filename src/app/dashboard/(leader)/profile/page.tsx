import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { getLeaderProfile } from '@/services/leader/getLeaderProfile';
import { getAllCities } from '@/services/admin/cities/getAllCities';
import { LeaderProfileForm } from '@/components/leader/LeaderProfileForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await isAuthenticated();
  if (!user) redirect('/login');

  const { role, leader } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || 'Líder',
  });

  const leaderProfile =
    role === 'leader'
      ? await getLeaderProfile(user.uid).catch(() => null)
      : null;

  const cities = await getAllCities();

  const cityIdRaw =
    (leaderProfile as any)?.cityId ??
    (leaderProfile as any)?.city ??
    (leaderProfile as any)?.cidadeId ??
    (leader as any)?.cityId ??
    '';

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Aqui você pode atualizar suas informações básicas e vincular sua cidade de atuação.
        </p>
      </div>

      <LeaderProfileForm
        leaderId={user.uid}
        cities={cities}
        initialCity={typeof cityIdRaw === 'string' ? cityIdRaw.trim() : ''}
        initialParty={(leaderProfile as any)?.politicalParty || ''}
        initialBio={(leaderProfile as any)?.bio || ''}
        initialInstagram={(leaderProfile as any)?.instagram || ''}
        initialFacebook={(leaderProfile as any)?.facebook || ''}
        initialAvatar={(leaderProfile as any)?.avatarUrl || user.photoURL || ''}
        initialCpf={(leaderProfile as any)?.cpf || ''}
        initialBairro={(leaderProfile as any)?.bairro || ''}
        initialAreaAtuacao={(leaderProfile as any)?.areaAtuacao || ''}
        initialLat={typeof (leaderProfile as any)?.lat === 'number' ? (leaderProfile as any)?.lat : undefined}
        initialLng={typeof (leaderProfile as any)?.lng === 'number' ? (leaderProfile as any)?.lng : undefined}
      />
    </div>
  );
}
