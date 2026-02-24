'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileText, User } from 'lucide-react';

const createIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 drop-shadow-md pb-1" style="transform: translate(-25%, -100%); width: 32px; height: 32px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="white"></circle>
            </svg>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const leaderIcon = createIcon('#0ea5e9'); // sky-500
const memberIcon = createIcon('#10b981'); // emerald-500

interface MapWrapperProps {
    leaders: AppUser[];
    members?: Member[];
}

export default function MapWrapper({ leaders, members = [] }: MapWrapperProps) {
    // Coordenadas padrão via Env ou fallback para São Luís, MA
    const defaultCenter: [number, number] = [
        Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT || -2.53),
        Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG || -44.30)
    ];

    const validLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');
    const validMembers = members.filter(m => typeof (m as any).lat === 'number' && typeof (m as any).lng === 'number');

    // Ajusta o centro do mapa para o primeiro líder se houver, ou mantém São Luís
    const center = validLeaders.length > 0 ? [validLeaders[0].lat!, validLeaders[0].lng!] as [number, number] : defaultCenter;

    // React Leaflet ODEIA o React Strict Mode (ocorre o erro 'Map container is already initialized').
    const [mapKey, setMapKey] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMapKey(Math.random().toString(36).substring(7));
        setMounted(true);
    }, []);

    if (!mounted || !mapKey) return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Carregando mapa...</div>;

    return (
        <MapContainer key={mapKey} center={center} zoom={13} maxZoom={20} className="h-full w-full relative z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
            />
            {validLeaders.map(leader => (
                <Marker key={`l-${leader.uid || leader.id || Math.random().toString()}`} position={[leader.lat!, leader.lng!]} icon={leaderIcon}>
                    <Popup>
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <span className="font-bold text-sm text-slate-900 flex items-center gap-1"><Users className="w-3 h-3 text-sky-500" /> {leader.name}</span>
                            <span className="text-xs text-sky-600 font-medium">{leader.role === 'master' ? 'Líder Master' : 'Líder'}</span>

                            <div className="h-px w-full bg-slate-200 my-1" />

                            <div className="grid grid-cols-[1fr_2fr] gap-x-2 text-xs">
                                <span className="text-slate-500">Bairro:</span>
                                <span className="font-medium text-slate-800">{leader.bairro || 'N/A'}</span>
                                <span className="text-slate-500">Área:</span>
                                <span className="font-medium text-slate-800">{leader.areaAtuacao || 'N/A'}</span>
                                <span className="text-slate-500">Votos:</span>
                                <span className="font-medium text-slate-800">{leader.influencia || 'N/A'}</span>
                            </div>

                            <div className="mt-2 text-right">
                                <Link href={`/dashboard/admin/leaders/${leader.id || leader.uid || ''}/view`} className="text-xs text-sky-600 font-semibold hover:underline flex items-center justify-end gap-1">
                                    <FileText className="w-3 h-3" />
                                    Ver Perfil Completo
                                </Link>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {validMembers.map(member => {
                const lat = (member as any).lat;
                const lng = (member as any).lng;
                return (
                    <Marker key={`m-${member.id}`} position={[lat, lng]} icon={memberIcon}>
                        <Popup>
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <span className="font-bold text-sm text-slate-900 flex items-center gap-1"><User className="w-3 h-3 text-emerald-500" /> {member.name}</span>
                                <span className="text-xs text-emerald-600 font-medium">Apoiador</span>

                                <div className="h-px w-full bg-slate-200 my-1" />

                                <div className="grid grid-cols-[1fr_2fr] gap-x-2 text-xs">
                                    <span className="text-slate-500">Cidade:</span>
                                    <span className="font-medium text-slate-800">{(member as any).cityName || 'N/A'}</span>
                                    <span className="text-slate-500">Bairro:</span>
                                    <span className="font-medium text-slate-800">{(member as any).neighborhood || 'N/A'}</span>
                                    <span className="text-slate-500">Líder:</span>
                                    <span className="font-medium text-slate-800">{member.leaderName || 'N/A'}</span>
                                    <span className="text-slate-500">Telefone:</span>
                                    <span className="font-medium text-slate-800">{member.phone || 'N/A'}</span>
                                    <span className="text-slate-500">Votos:</span>
                                    <span className="font-medium text-emerald-700">{member.votePotential || 0}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    );
}
