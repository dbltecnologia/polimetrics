'use client';

import dynamic from 'next/dynamic';
import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';

// Carrega o Leaflet apenas no lado do cliente
const MapWrapper = dynamic(() => import('./MapWrapper'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">
            Carregando Mapa...
        </div>
    )
});

interface InteractiveMapProps {
    leaders: AppUser[];
    members?: Member[];
}

export function InteractiveMap({ leaders, members = [] }: InteractiveMapProps) {
    return (
        <div className="h-[650px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 isolation-auto">
            <MapWrapper leaders={leaders} members={members} />
        </div>
    );
}
