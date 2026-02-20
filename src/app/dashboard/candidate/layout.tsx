import { ReactNode } from 'react';
import Header from '@/components/layout/header';
import { LeaderSidebar, LeaderMobileNav } from '../(leader)/_components/leader-nav';

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[260px_1fr] bg-muted/30">
      <aside className="hidden border-r bg-card/60 backdrop-blur lg:block">
        <div className="border-b px-4 py-5">
          <p className="text-xs uppercase text-muted-foreground">Painel do Candidato</p>
          <h2 className="text-lg font-semibold">Acompanhe suas métricas</h2>
        </div>
        <LeaderSidebar />
      </aside>

      <div className="flex min-h-screen flex-col">
        <Header />
        <LeaderMobileNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
