'use client';

import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';
import { Users, FileText, User, X, Phone, MapPin, TrendingUp, ChevronRight } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps-config';

const containerStyle = { width: '100%', height: '100%' };

const defaultCenter = {
    lat: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT || -15.78),
    lng: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG || -47.93)
};

interface MapWrapperProps {
    leaders: AppUser[];
    members?: Member[];
    centerCity?: string; // e.g. "Guarulhos" — triggers geocode + pan
}

// SVG marker factory — retorna data URL para uso no Google Maps
function makeSvgMarker(color: string, size: number, isLeader: boolean) {
    const icon = isLeader
        ? `<text x="14" y="16" font-size="12" text-anchor="middle" fill="white">👥</text>`
        : `<circle cx="14" cy="11" r="5" fill="white"/>`;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 28 39">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 25 14 25s14-15.667 14-25C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      ${icon}
    </svg>`.trim();

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const LEADER_ICON = makeSvgMarker('#1d4ed8', 36, true);          // Blue leader
const LEADER_SELECTED_ICON = makeSvgMarker('#f59e0b', 42, true); // Gold selected leader
const MEMBER_ICON = makeSvgMarker('#16a34a', 26, false);          // Green member
const MEMBER_HIGHLIGHT_ICON = makeSvgMarker('#f59e0b', 30, false); // Gold highlighted member

export default function MapWrapper({ leaders, members = [], centerCity }: MapWrapperProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeLeaderId, setActiveLeaderId] = useState<string | null>(null);
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null); // persistido no painel lateral

    const validLeaders = useMemo(() =>
        leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number'),
        [leaders]);

    const validMembers = useMemo(() =>
        members.filter(m => typeof (m as any).lat === 'number' && typeof (m as any).lng === 'number'),
        [members]);

    // Membros filtrados quando um líder está selecionado
    const filteredMembers = useMemo(() => {
        if (!selectedLeaderId) return validMembers;
        return validMembers.filter(m => (m as any).leaderId === selectedLeaderId);
    }, [validMembers, selectedLeaderId]);

    const selectedLeader = useMemo(() =>
        validLeaders.find(l => (l.id || l.uid) === selectedLeaderId) ?? null,
        [validLeaders, selectedLeaderId]);

    const selectedLeaderMembers = useMemo(() => {
        if (!selectedLeaderId) return [];
        return members.filter(m => (m as any).leaderId === selectedLeaderId);
    }, [members, selectedLeaderId]);

    const totalVotes = useMemo(() =>
        validMembers.reduce((acc, m) => acc + (Number((m as any).votePotential) || 0), 0),
        [validMembers]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        validLeaders.forEach(l => { bounds.extend({ lat: l.lat!, lng: l.lng! }); hasPoints = true; });
        validMembers.forEach(m => {
            bounds.extend({ lat: (m as any).lat, lng: (m as any).lng });
            hasPoints = true;
        });

        if (hasPoints) {
            mapInstance.fitBounds(bounds);
            const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
                const z = mapInstance.getZoom();
                if (z && z > 16) mapInstance.setZoom(16);
                window.google.maps.event.removeListener(listener);
            });
        }
        setMap(mapInstance);
    }, [validLeaders, validMembers]);

    // Pan to selected city when it changes
    const prevCenterCity = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!map || !centerCity || centerCity === 'all') return;
        if (centerCity === prevCenterCity.current) return;
        prevCenterCity.current = centerCity;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: `${centerCity}, Brasil` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                map.panTo({ lat: loc.lat(), lng: loc.lng() });
                map.setZoom(13);
            }
        });
    }, [map, centerCity]);

    // When city resets to 'all', refit all markers
    useEffect(() => {
        if (!map || centerCity !== 'all') return;
        if (validLeaders.length === 0 && validMembers.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        validLeaders.forEach(l => bounds.extend({ lat: l.lat!, lng: l.lng! }));
        validMembers.forEach(m => bounds.extend({ lat: (m as any).lat, lng: (m as any).lng }));
        map.fitBounds(bounds);
    }, [map, centerCity, validLeaders, validMembers]);


    const onUnmount = useCallback(() => setMap(null), []);

    const handleLeaderClick = (leader: AppUser) => {
        const id = leader.id || leader.uid || '';
        setActiveLeaderId(id);
        setActiveMemberId(null);

        // Select leader to show their members in panel + filter
        setSelectedLeaderId(prev => prev === id ? null : id);

        // Zoom to leader's members if any
        if (map) {
            const theirMembers = validMembers.filter(m => (m as any).leaderId === id);
            if (theirMembers.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend({ lat: leader.lat!, lng: leader.lng! });
                theirMembers.forEach(m => bounds.extend({ lat: (m as any).lat, lng: (m as any).lng }));
                map.fitBounds(bounds, 60);
            }
        }
    };

    const center = validLeaders.length > 0
        ? { lat: validLeaders[0].lat!, lng: validLeaders[0].lng! }
        : defaultCenter;

    if (!isLoaded) {
        return (
            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Carregando mapa...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden flex">
            {/* MAP */}
            <div className={`flex-1 transition-all duration-300 ${selectedLeaderId ? 'mr-0 md:mr-80' : ''}`}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={() => { setActiveLeaderId(null); setActiveMemberId(null); }}
                    options={{
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                        maxZoom: 20,
                        styles: [
                            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                        ],
                    }}
                >
                    {/* LEADER MARKERS */}
                    {validLeaders.map(leader => {
                        const id = leader.id || leader.uid || '';
                        const isSelected = selectedLeaderId === id;
                        const memberCount = members.filter(m => (m as any).leaderId === id).length;
                        return (
                            <Marker
                                key={`l-${id}`}
                                position={{ lat: leader.lat!, lng: leader.lng! }}
                                icon={{
                                    url: isSelected ? LEADER_SELECTED_ICON : LEADER_ICON,
                                    scaledSize: new window.google.maps.Size(isSelected ? 42 : 36, isSelected ? 59 : 50),
                                    anchor: new window.google.maps.Point(isSelected ? 21 : 18, isSelected ? 59 : 50),
                                }}
                                zIndex={isSelected ? 10 : 5}
                                onClick={() => handleLeaderClick(leader)}
                            >
                                {activeLeaderId === id && (
                                    <InfoWindow onCloseClick={() => setActiveLeaderId(null)}>
                                        <div className="flex flex-col gap-2 min-w-[220px] max-w-[260px] p-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-4 h-4 text-blue-700" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 leading-tight">{leader.name}</p>
                                                    <p className="text-xs text-blue-600 font-medium">
                                                        {leader.role === 'master' ? 'Líder Master' : leader.role === 'sub' ? 'Sub-Líder' : 'Líder'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1 bg-slate-50 rounded-lg p-2">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-blue-700">{memberCount}</p>
                                                    <p className="text-[10px] text-slate-500">Apoiadores</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-emerald-600">
                                                        {members.filter(m => (m as any).leaderId === id).reduce((a, m) => a + (Number((m as any).votePotential) || 0), 0)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">Votos Pot.</p>
                                                </div>
                                            </div>

                                            {(leader.bairro || (leader as any).cityName) && (
                                                <div className="flex items-center gap-1 text-xs text-slate-600">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    <span>{[leader.bairro, (leader as any).cityName].filter(Boolean).join(' · ')}</span>
                                                </div>
                                            )}

                                            <button
                                                className="w-full mt-1 py-1.5 px-3 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                                onClick={() => { setSelectedLeaderId(id); setActiveLeaderId(null); }}
                                            >
                                                <Users className="w-3 h-3" />
                                                {isSelected ? 'Ocultar apoiadores' : 'Ver apoiadores no mapa'}
                                            </button>

                                            <Link
                                                href={`/dashboard/admin/leaders/${id}/view`}
                                                className="text-xs text-blue-600 font-semibold hover:underline flex items-center justify-end gap-1"
                                            >
                                                <FileText className="w-3 h-3" /> Ver perfil completo
                                            </Link>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        );
                    })}

                    {/* MEMBER MARKERS — show all or filtered */}
                    {(selectedLeaderId ? filteredMembers : validMembers).map(member => {
                        const lat = (member as any).lat;
                        const lng = (member as any).lng;
                        const id = `m-${member.id}`;
                        const isHighlighted = !!selectedLeaderId;
                        return (
                            <Marker
                                key={id}
                                position={{ lat, lng }}
                                icon={{
                                    url: isHighlighted ? MEMBER_HIGHLIGHT_ICON : MEMBER_ICON,
                                    scaledSize: new window.google.maps.Size(isHighlighted ? 30 : 26, isHighlighted ? 42 : 36),
                                    anchor: new window.google.maps.Point(isHighlighted ? 15 : 13, isHighlighted ? 42 : 36),
                                }}
                                zIndex={3}
                                onClick={() => setActiveMemberId(member.id)}
                            >
                                {activeMemberId === member.id && (
                                    <InfoWindow onCloseClick={() => setActiveMemberId(null)}>
                                        <div className="flex flex-col gap-1.5 min-w-[200px] p-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-emerald-700" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{member.name}</p>
                                                    <p className="text-xs text-emerald-600 font-medium">Apoiador</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-slate-200" />
                                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                                                {(member as any).cityName && <><span className="text-slate-400">Cidade</span><span className="font-medium">{(member as any).cityName}</span></>}
                                                {(member as any).bairro && <><span className="text-slate-400">Bairro</span><span className="font-medium">{(member as any).bairro}</span></>}
                                                {member.leaderName && <><span className="text-slate-400">Líder</span><span className="font-medium">{member.leaderName}</span></>}
                                                {member.phone && <><span className="text-slate-400">Fone</span><a href={`tel:${member.phone}`} className="font-medium text-blue-600">{member.phone}</a></>}
                                                <span className="text-slate-400">Votos</span><span className="font-bold text-emerald-600">{member.votePotential || 0}</span>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        );
                    })}
                </GoogleMap>
            </div>

            {/* SIDE PANEL — Leader Detail */}
            {selectedLeaderId && selectedLeader && (
                <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-4 text-white flex-shrink-0">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                                    {(selectedLeader.name || 'L').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-base leading-tight">{selectedLeader.name}</p>
                                    <p className="text-blue-200 text-xs mt-0.5">
                                        {selectedLeader.role === 'master' ? 'Líder Master' : selectedLeader.role === 'sub' ? 'Sub-Líder' : 'Líder Político'}
                                    </p>
                                    {((selectedLeader as any).cityName || (selectedLeader as any).bairro) && (
                                        <p className="text-blue-200 text-xs flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {[(selectedLeader as any).bairro, (selectedLeader as any).cityName].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLeaderId(null)}
                                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="bg-white/10 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">{selectedLeaderMembers.length}</p>
                                <p className="text-[10px] text-blue-200">Apoiadores</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">
                                    {selectedLeaderMembers.reduce((a, m) => a + (Number((m as any).votePotential) || 0), 0)}
                                </p>
                                <p className="text-[10px] text-blue-200">Pot. Votos</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">
                                    {new Set(selectedLeaderMembers.map(m => (m as any).cityName).filter(Boolean)).size || '—'}
                                </p>
                                <p className="text-[10px] text-blue-200">Cidades</p>
                            </div>
                        </div>
                    </div>

                    {/* Members list */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Apoiadores no mapa ({filteredMembers.length})
                            </p>
                            {filteredMembers.length < selectedLeaderMembers.length && (
                                <span className="text-xs text-amber-600">{selectedLeaderMembers.length - filteredMembers.length} sem geoloc.</span>
                            )}
                        </div>

                        {selectedLeaderMembers.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Nenhum apoiador cadastrado</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-50">
                                {selectedLeaderMembers.map(m => {
                                    const hasGeo = typeof (m as any).lat === 'number';
                                    return (
                                        <li key={m.id} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors ${!hasGeo ? 'opacity-60' : ''}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${hasGeo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {(m.name || 'A').split(' ').map(w => w[0]).slice(0, 1).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {[(m as any).bairro, (m as any).cityName].filter(Boolean).join(' · ') || 'Sem endereço'}
                                                    {!hasGeo ? ' · sem localização' : ''}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <p className="text-xs font-bold text-emerald-600">{(m as any).votePotential || 0}</p>
                                                <p className="text-[9px] text-slate-400">votos</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 flex-shrink-0">
                        <Link
                            href={`/dashboard/admin/leaders/${selectedLeaderId}/view`}
                            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Ver perfil completo
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            {/* FLOATING LEGEND */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-3 py-2 flex items-center gap-4 text-xs z-10">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                    <span className="text-slate-600 font-medium">Líderes <span className="font-bold text-slate-900">{validLeaders.length}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-600 font-medium">Apoiadores <span className="font-bold text-slate-900">{validMembers.length}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 font-medium">Pot. <span className="font-bold text-emerald-700">{totalVotes.toLocaleString('pt-BR')}</span> votos</span>
                </div>
                {selectedLeaderId && (
                    <button
                        onClick={() => setSelectedLeaderId(null)}
                        className="ml-1 text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-0.5"
                    >
                        <X className="w-3 h-3" /> Limpar filtro
                    </button>
                )}
            </div>
        </div>
    );
}
