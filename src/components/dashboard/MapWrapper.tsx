'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AppUser } from '@/types/user';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileText } from 'lucide-react';

export default function MapWrapper({ leaders }: { leaders: AppUser[] }) {
    useEffect(() => {
        // Corrige os ícones padrão do Leaflet no Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Coordenadas padrão (São Luís, MA)
    const defaultCenter: [number, number] = [-2.53, -44.30];

    const validLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');

    // Ajusta o centro do mapa para o primeiro líder se houver, ou mantém São Luís
    const center = validLeaders.length > 0 ? [validLeaders[0].lat!, validLeaders[0].lng!] as [number, number] : defaultCenter;

    // React Leaflet ODEIA o React Strict Mode (ocorre o erro 'Map container is already initialized').
    // O trambique ofial da comunidade é injetar uma Key baseada num estado para forçar a remontagem segura
    // quando o HMR do Next.js bate, ou engolir as recriações. 
    // Outra alternativa mais simples é atar a Key ao `center` atual, resolvendo remounts em fast-refresh.
    const mapKey = center ? `${center[0]}-${center[1]}` : 'default-map-key';

    // Evita hidratação inicial quebrada (diferença server-client) aguardando o mount
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Carregando mapa...</div>;

    return (
        <MapContainer key={mapKey} center={center} zoom={12} className="h-full w-full relative z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validLeaders.map(leader => (
                <Marker key={leader.uid || leader.id || Math.random().toString()} position={[leader.lat!, leader.lng!]}>
                    <Popup>
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <span className="font-bold text-sm text-slate-900">{leader.name}</span>
                            <span className="text-xs text-slate-500 font-medium">{leader.role === 'master' ? 'Líder Master' : 'Líder'}</span>

                            <div className="h-px w-full bg-slate-200 my-1" />

                            <div className="grid grid-cols-[1fr_2fr] gap-x-2 text-xs">
                                <span className="text-slate-500">Bairro:</span>
                                <span className="font-medium text-slate-800">{leader.bairro || 'N/A'}</span>
                                <span className="text-slate-500">Área:</span>
                                <span className="font-medium text-slate-800">{leader.areaAtuacao || 'N/A'}</span>
                                <span className="text-slate-500">Influência:</span>
                                <span className="font-medium text-slate-800">{leader.influencia || 'N/A'}</span>
                            </div>

                            <div className="mt-2 text-right">
                                <Link href={`/dashboard/admin/leaders/${leader.id || leader.uid || ''}/view`} className="text-xs text-primary font-semibold hover:underline flex items-center justify-end gap-1">
                                    <FileText className="w-3 h-3" />
                                    Ver Perfil Completo
                                </Link>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
