'use client';

import { useState, useEffect } from 'react';
import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { InteractiveMap } from '@/components/dashboard/InteractiveMap';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, Filter, User } from 'lucide-react';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MapClientProps {
    leaders: AppUser[];
    members: Member[];
}

export function MapClient({ leaders, members }: MapClientProps) {
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedCity = localStorage.getItem('map:selectedCity');
        const savedHood = localStorage.getItem('map:selectedNeighborhood');
        const savedType = localStorage.getItem('map:filterType');

        if (savedCity) setSelectedCity(savedCity);
        if (savedHood) setSelectedNeighborhood(savedHood);
        if (savedType) setFilterType(savedType);

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('map:selectedCity', selectedCity);
        localStorage.setItem('map:selectedNeighborhood', selectedNeighborhood);
        localStorage.setItem('map:filterType', filterType);
    }, [selectedCity, selectedNeighborhood, filterType, isLoaded]);

    let mappedLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');
    let mappedMembers = members.filter(m => typeof (m as any).lat === 'number' && typeof (m as any).lng === 'number');

    // Extract available cities and neighborhoods BEFORE applying the geo filters
    const citiesSet = new Set<string>();
    mappedLeaders.forEach(l => { if ((l as any).cityName) citiesSet.add((l as any).cityName); });
    mappedMembers.forEach(m => { if ((m as any).cityName) citiesSet.add((m as any).cityName); });
    const availableCities = Array.from(citiesSet).sort();

    // Apply city filter
    if (selectedCity !== 'all') {
        mappedLeaders = mappedLeaders.filter(l => (l as any).cityName === selectedCity);
        mappedMembers = mappedMembers.filter(m => (m as any).cityName === selectedCity);
    }

    const neighborhoodsSet = new Set<string>();
    mappedLeaders.forEach(l => { if ((l as any).bairro) neighborhoodsSet.add((l as any).bairro); if ((l as any).neighborhood) neighborhoodsSet.add((l as any).neighborhood); });
    mappedMembers.forEach(m => { if ((m as any).neighborhood) neighborhoodsSet.add((m as any).neighborhood); if ((m as any).bairro) neighborhoodsSet.add((m as any).bairro); });
    const availableNeighborhoods = Array.from(neighborhoodsSet).sort();

    // Apply neighborhood filter
    if (selectedNeighborhood !== 'all') {
        mappedLeaders = mappedLeaders.filter(l => ((l as any).bairro === selectedNeighborhood || (l as any).neighborhood === selectedNeighborhood));
        mappedMembers = mappedMembers.filter(m => ((m as any).neighborhood === selectedNeighborhood || (m as any).bairro === selectedNeighborhood));
    }

    const displayLeaders = filterType === 'all' || filterType === 'leaders' ? mappedLeaders : [];
    const displayMembers = filterType === 'all' || filterType === 'members' ? mappedMembers : [];

    return (
        <div className="space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">

                <Link href="/dashboard/admin/leaders" className="block outline-none">
                    <Card className="shadow-sm hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-sm text-muted-foreground font-medium line-clamp-1">Líderes (Mapa)</p>
                                <p className="text-xl md:text-2xl font-bold">{mappedLeaders.length}</p>
                            </div>
                            <div className="bg-primary/10 p-2 md:p-3 rounded-xl text-primary">
                                <MapPin className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>


                <Link href="/dashboard/admin/members" className="block outline-none">
                    <Card className="shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-sm text-muted-foreground font-medium line-clamp-1">Apoiadores (Mapa)</p>
                                <p className="text-xl md:text-2xl font-bold">{mappedMembers.length}</p>
                            </div>
                            <div className="bg-emerald-50 p-2 md:p-3 rounded-xl text-emerald-600">
                                <User className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-medium text-muted-foreground">Localidade (Cidade)</span>
                    </div>
                    <Select onValueChange={(val) => { setSelectedCity(val); setSelectedNeighborhood('all'); }} value={selectedCity}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Todas as Cidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Cidades</SelectItem>
                            {availableCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-medium text-muted-foreground">Bairro (Microrregião)</span>
                    </div>
                    <Select onValueChange={setSelectedNeighborhood} value={selectedNeighborhood} disabled={selectedCity === 'all' || availableNeighborhoods.length === 0}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Todos os Bairros" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Bairros</SelectItem>
                            {availableNeighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Filtro de Exibição</span>
                    </div>
                    <Select onValueChange={setFilterType} value={filterType}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="O que exibir" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos (Líderes e Apoiadores)</SelectItem>
                            <SelectItem value="leaders">Apenas Líderes</SelectItem>
                            <SelectItem value="members">Apenas Apoiadores</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 w-full bg-slate-50 rounded-2xl relative">
                <InteractiveMap leaders={displayLeaders} members={displayMembers} />
            </div>
        </div>
    );
}
