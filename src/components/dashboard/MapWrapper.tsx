'use client';

import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';
import { Users, FileText, User } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Coordenadas padrão via Env ou fallback para São Luís, MA
const defaultCenter = {
    lat: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT || -2.53),
    lng: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG || -44.30)
};

interface MapWrapperProps {
    leaders: AppUser[];
    members?: Member[];
}

export default function MapWrapper({ leaders, members = [] }: MapWrapperProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<string | null>(null);

    const validLeaders = useMemo(() => leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number'), [leaders]);
    const validMembers = useMemo(() => members.filter(m => typeof (m as any).lat === 'number' && typeof (m as any).lng === 'number'), [members]);

    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        validLeaders.forEach(l => {
            bounds.extend({ lat: l.lat!, lng: l.lng! });
            hasPoints = true;
        });

        validMembers.forEach(m => {
            const lat = (m as any).lat;
            const lng = (m as any).lng;
            bounds.extend({ lat, lng });
            hasPoints = true;
        });

        if (hasPoints) {
            mapInstance.fitBounds(bounds);
            // Corrige o zoom excessivo em bounds muito pequenos
            const listener = window.google.maps.event.addListener(mapInstance, "idle", function () {
                if (mapInstance.getZoom() && mapInstance.getZoom()! > 18) {
                    mapInstance.setZoom(18);
                }
                window.google.maps.event.removeListener(listener);
            });
        }

        setMap(mapInstance);
    }, [validLeaders, validMembers]);

    const onUnmount = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(null);
    }, []);

    const center = validLeaders.length > 0 ? { lat: validLeaders[0].lat!, lng: validLeaders[0].lng! } : defaultCenter;

    if (!isLoaded) return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Carregando mapa do Google...</div>;

    // Marcadores clássicos do G-Maps para diferenciar Leader/Member
    const leaderIconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    const memberIconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                mapTypeControl: false,
                streetViewControl: false,
                maxZoom: 20
            }}
        >
            {validLeaders.map(leader => {
                const id = `l-${leader.uid || leader.id || Math.random()}`;
                return (
                    <Marker
                        key={id}
                        position={{ lat: leader.lat!, lng: leader.lng! }}
                        icon={{ url: leaderIconUrl }}
                        onClick={() => setActiveMarker(id)}
                    >
                        {activeMarker === id && (
                            <InfoWindow onCloseClick={() => setActiveMarker(null)}>
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
                            </InfoWindow>
                        )}
                    </Marker>
                );
            })}

            {validMembers.map(member => {
                const lat = (member as any).lat;
                const lng = (member as any).lng;
                const id = `m-${member.id}`;
                return (
                    <Marker
                        key={id}
                        position={{ lat, lng }}
                        icon={{ url: memberIconUrl }}
                        onClick={() => setActiveMarker(id)}
                    >
                        {activeMarker === id && (
                            <InfoWindow onCloseClick={() => setActiveMarker(null)}>
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
                            </InfoWindow>
                        )}
                    </Marker>
                );
            })}
        </GoogleMap>
    );
}
