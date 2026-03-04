'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps-config';
import { Users, User, TrendingUp, MapPin, Phone, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: -15.78, lng: -47.93 };

function makeSvgPin(color: string, size: number) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 28 39">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 25 14 25s14-15.667 14-25C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="5" fill="white"/>
  </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const MY_ICON = makeSvgPin('#1d4ed8', 38);       // Blue — the leader themselves
const MEMBER_ICON = makeSvgPin('#16a34a', 28);    // Green — member

export default function LeaderMapPage() {
    const { user, loading: userLoading } = useUser();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    useEffect(() => {
        if (userLoading || !user?.uid) return;
        fetch(`/api/leader/dashboard?uid=${user.uid}`)
            .then(r => r.json())
            .then(data => { setDashboardData(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [user, userLoading]);

    const leader = dashboardData?.leader;
    const members: any[] = dashboardData?.members || [];

    const mappedMembers = useMemo(
        () => members.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number'),
        [members]
    );

    const totalVotes = useMemo(
        () => members.reduce((a: number, m: any) => a + (Number(m.votePotential) || 0), 0),
        [members]
    );

    const center = useMemo(() => {
        if (leader?.lat && leader?.lng) return { lat: leader.lat, lng: leader.lng };
        if (mappedMembers.length > 0) return { lat: mappedMembers[0].lat, lng: mappedMembers[0].lng };
        return defaultCenter;
    }, [leader, mappedMembers]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Carregando mapa da rede...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-primary/20">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{members.length}</p>
                            <p className="text-xs text-muted-foreground">Apoiadores</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/20">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="bg-emerald-50 p-2.5 rounded-xl">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{mappedMembers.length}</p>
                            <p className="text-xs text-muted-foreground">No mapa</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/20">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="bg-amber-50 p-2.5 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalVotes.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-muted-foreground">Pot. Votos</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map */}
            <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border bg-slate-50 relative">
                {!isLoaded ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={12}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
                        }}
                    >
                        {/* Leader's own position */}
                        {leader?.lat && leader?.lng && (
                            <Marker
                                position={{ lat: leader.lat, lng: leader.lng }}
                                icon={{ url: MY_ICON, scaledSize: new window.google.maps.Size(38, 53), anchor: new window.google.maps.Point(19, 53) }}
                                zIndex={10}
                                onClick={() => setActiveId('leader')}
                            >
                                {activeId === 'leader' && (
                                    <InfoWindow onCloseClick={() => setActiveId(null)}>
                                        <div className="p-1 min-w-[160px]">
                                            <p className="font-bold text-sm text-primary">{leader.name || 'Você'}</p>
                                            <p className="text-xs text-blue-600 font-medium">Você (Líder)</p>
                                            {leader.bairro && (
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {leader.bairro}
                                                </p>
                                            )}
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        )}

                        {/* Member markers */}
                        {mappedMembers.map(m => (
                            <Marker
                                key={m.id}
                                position={{ lat: m.lat, lng: m.lng }}
                                icon={{ url: MEMBER_ICON, scaledSize: new window.google.maps.Size(28, 39), anchor: new window.google.maps.Point(14, 39) }}
                                zIndex={5}
                                onClick={() => setActiveId(m.id)}
                            >
                                {activeId === m.id && (
                                    <InfoWindow onCloseClick={() => setActiveId(null)}>
                                        <div className="flex flex-col gap-1.5 min-w-[180px] p-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                                                    {(m.name || 'A')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{m.name}</p>
                                                    <p className="text-xs text-emerald-600">Apoiador</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-100" />
                                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                                                {m.bairro && <><span className="text-slate-400">Bairro</span><span className="font-medium">{m.bairro}</span></>}
                                                {m.cityName && <><span className="text-slate-400">Cidade</span><span className="font-medium">{m.cityName}</span></>}
                                                {m.phone && <><span className="text-slate-400">Fone</span><a href={`tel:${m.phone}`} className="font-medium text-blue-600">{m.phone}</a></>}
                                                <span className="text-slate-400">Votos</span>
                                                <span className="font-bold text-emerald-600">{m.votePotential || 0}</span>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        ))}
                    </GoogleMap>
                )}

                {/* Floating legend */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 flex items-center gap-4 text-xs z-10">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                        <span className="text-slate-600">Você</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-slate-600 font-medium">Apoiadores <span className="font-bold text-slate-900">{mappedMembers.length}</span></span>
                    </div>
                    {mappedMembers.length < members.length && (
                        <span className="text-amber-600 font-medium">{members.length - mappedMembers.length} sem localização</span>
                    )}
                </div>
            </div>

            {/* Members without geo - hint */}
            {members.length > mappedMembers.length && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">
                            {members.length - mappedMembers.length} apoiador(es) sem localização
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Edite o cadastro deles e salve um endereço para que apareçam no mapa automaticamente.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
