'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/context/session-context';
import { useUser } from '@/contexts/UserContext';

export default function WelcomePage() {
  const { loading: sessionLoading } = useSession();
  const { user, loading: profileLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (sessionLoading || profileLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/dashboard/admin');
      return;
    }

    router.replace('/dashboard');
  }, [profileLoading, sessionLoading, router, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50/40 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-4 text-slate-500">Redirecionando para o seu painel...</p>
    </div>
  );
}
