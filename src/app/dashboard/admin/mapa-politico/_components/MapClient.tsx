'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppUser } from '@/types/user';
import { Member } from '@/services/admin/members/getAllMembers';
import { InteractiveMap } from '@/components/dashboard/InteractiveMap';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, Filter, User, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    cities: { id: string; name: string; state: string }[];
}

// Bairros padrão pré-definidos por estado (DF)
const DEFAULT_NEIGHBORHOODS: Record<string, string[]> = {
    DF: [
        'Asa Norte', 'Asa Sul', 'Lago Norte', 'Lago Sul', 'Guará',
        'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina', 'Sobradinho',
        'Gama', 'Santa Maria', 'Recanto das Emas', 'São Sebastião', 'Riacho Fundo',
        'Núcleo Bandeirante', 'Candangolândia', 'Itapoã', 'Paranoá', 'Brazlândia',
        'Park Way', 'Sudoeste', 'Octogonal', 'Cruzeiro', 'SIA', 'Jardim Botânico',
    ],
    SP: [
        'Centro', 'Consolação', 'Pinheiros', 'Moema', 'Itaim Bibi',
        'Vila Olímpia', 'Morumbi', 'Lapa', 'Santana', 'Tatuapé',
        'Mooca', 'Penha', 'Ipiranga', 'Santo André', 'São Bernardo do Campo',
        'Guarulhos', 'Osasco', 'Campinas', 'Santos', 'Ribeirão Preto',
    ],
    RJ: [
        'Centro', 'Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca',
        'Tijuca', 'Santa Teresa', 'Lapa', 'Botafogo', 'Flamengo',
        'Madureira', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'Belford Roxo',
    ],
    MG: [
        'Centro', 'Savassi', 'Lourdes', 'Funcionários', 'Santo Agostinho',
        'Pampulha', 'Buritis', 'Barreiro', 'Venda Nova', 'Nordeste',
        'Contagem', 'Betim', 'Uberlândia', 'Juiz de Fora', 'Montes Claros',
    ],
    PR: [
        'Centro', 'Batel', 'Água Verde', 'Portão', 'Xaxim',
        'Capão Raso', 'Boqueirão', 'Pinheirinho', 'Sítio Cercado', 'CIC',
        'Londrina', 'Maringá', 'Cascavel', 'Foz do Iguaçu', 'Ponta Grossa',
    ],
    RS: [
        'Centro Histórico', 'Moinhos de Vento', 'Bela Vista', 'Petrópolis',
        'Boa Vista', 'Sarandi', 'Passo D\'Areia', 'Canoas', 'Gravataí', 'Caxias do Sul',
    ],
    SC: [
        'Centro', 'Trindade', 'Agronômica', 'Córrego Grande', 'Itacorubi',
        'Campinas', 'Kobrasol', 'Barreiros', 'Joinville', 'Blumenau',
    ],
    BA: [
        'Centro', 'Barra', 'Ondina', 'Graça', 'Vitória', 'Federação',
        'IAPI', 'Brotas', 'Itapuã', 'Lauro de Freitas', 'Camaçari',
    ],
    PE: [
        'Centro', 'Boa Viagem', 'Madalena', 'Torre', 'Espinheiro',
        'Casa Amarela', 'Olinda', 'Caruaru', 'Petrolina',
    ],
    GO: [
        'Centro', 'Setor Bueno', 'Jardim Goiás', 'Setor Aeroporto', 'Aparecida de Goiânia',
        'Anápolis', 'Rio Verde', 'Luziânia', 'Trindade',
    ],
    CE: [
        'Centro', 'Meireles', 'Aldeota', 'Fátima', 'Papicu',
        'Maraponga', 'Messejana', 'Fortaleza', 'Caucaia', 'Maracanaú',
    ],
    MA: ['Centro', 'São Francisco', 'Jaracati', 'Renascença', 'Turu', 'Cohama', 'Timon'],
    PA: ['Centro', 'Batista Campos', 'Umarizal', 'Marco', 'Pedreira', 'Icoaraci', 'Ananindeua'],
};

function getStateCookie(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|; )polimetrics_state=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function MapClient({ leaders, members, cities: allCities }: MapClientProps) {
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
    const [isLoaded, setIsLoaded] = useState(false);
    const [userState, setUserState] = useState<string>('');
    // Custom neighborhood input
    const [showAddNeighborhood, setShowAddNeighborhood] = useState(false);
    const [newNeighborhood, setNewNeighborhood] = useState('');
    const [customNeighborhoods, setCustomNeighborhoods] = useState<string[]>([]);

    useEffect(() => {
        const state = getStateCookie();
        setUserState(state);

        const savedCity = localStorage.getItem('map:selectedCity');
        const savedHood = localStorage.getItem('map:selectedNeighborhood');
        const savedType = localStorage.getItem('map:filterType');
        const savedCustom = localStorage.getItem(`map:customNeighborhoods:${state}`);

        if (savedCity) setSelectedCity(savedCity);
        if (savedHood) setSelectedNeighborhood(savedHood);
        if (savedType) setFilterType(savedType);
        if (savedCustom) setCustomNeighborhoods(JSON.parse(savedCustom));

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('map:selectedCity', selectedCity);
        localStorage.setItem('map:selectedNeighborhood', selectedNeighborhood);
        localStorage.setItem('map:filterType', filterType);
    }, [selectedCity, selectedNeighborhood, filterType, isLoaded]);

    // Cities filtered by user's state
    const availableCities = useMemo(() => {
        const stateCities = userState
            ? allCities.filter(c => c.state === userState)
            : allCities;
        return stateCities.map(c => c.name).filter(Boolean).sort();
    }, [allCities, userState]);

    // Neighborhoods: predefined defaults + real data from leaders/members + custom
    const availableNeighborhoods = useMemo(() => {
        const set = new Set<string>();

        // 1. Predefined defaults for user's state
        const defaults = DEFAULT_NEIGHBORHOODS[userState] || [];
        defaults.forEach(n => set.add(n));

        // 2. Real data from leaders/members (filtered by selected city if applicable)
        const filteredLeaders = selectedCity === 'all' ? leaders : leaders.filter(l => (l as any).cityName === selectedCity);
        const filteredMembers = selectedCity === 'all' ? members : members.filter(m => (m as any).cityName === selectedCity);

        filteredLeaders.forEach(l => {
            if ((l as any).bairro) set.add((l as any).bairro);
            if ((l as any).neighborhood) set.add((l as any).neighborhood);
        });
        filteredMembers.forEach(m => {
            if ((m as any).neighborhood) set.add((m as any).neighborhood);
            if ((m as any).bairro) set.add((m as any).bairro);
        });

        // 3. User custom additions
        customNeighborhoods.forEach(n => set.add(n));

        return Array.from(set).filter(Boolean).sort();
    }, [leaders, members, selectedCity, userState, customNeighborhoods]);

    const handleAddNeighborhood = () => {
        const trimmed = newNeighborhood.trim();
        if (!trimmed || customNeighborhoods.includes(trimmed)) return;
        const updated = [...customNeighborhoods, trimmed].sort();
        setCustomNeighborhoods(updated);
        localStorage.setItem(`map:customNeighborhoods:${userState}`, JSON.stringify(updated));
        setSelectedNeighborhood(trimmed);
        setNewNeighborhood('');
        setShowAddNeighborhood(false);
    };

    let mappedLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');
    let mappedMembers = members.filter(m => typeof (m as any).lat === 'number' && typeof (m as any).lng === 'number');

    if (selectedCity !== 'all') {
        mappedLeaders = mappedLeaders.filter(l => (l as any).cityName === selectedCity);
        mappedMembers = mappedMembers.filter(m => (m as any).cityName === selectedCity);
    }
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
                {/* City select — filtered by user state */}
                <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-medium text-muted-foreground">
                            Localidade (Cidade){userState ? ` — ${userState}` : ''}
                        </span>
                    </div>
                    <Select onValueChange={(val) => { setSelectedCity(val); setSelectedNeighborhood('all'); }} value={selectedCity}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Todas as Cidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Cidades</SelectItem>
                            {availableCities.filter(c => c && c.trim()).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Neighborhood select — predefined + real + custom */}
                <div className="flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-medium text-muted-foreground">Bairro (Microrregião)</span>
                        <button
                            className="ml-auto text-primary hover:text-primary/80 transition-colors"
                            title="Adicionar bairro personalizado"
                            onClick={() => setShowAddNeighborhood(v => !v)}
                        >
                            {showAddNeighborhood ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    {showAddNeighborhood ? (
                        <div className="flex gap-1">
                            <Input
                                className="h-9 text-sm bg-white"
                                placeholder="Nome do bairro..."
                                value={newNeighborhood}
                                onChange={e => setNewNeighborhood(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddNeighborhood()}
                                autoFocus
                            />
                            <Button size="sm" className="h-9 px-3" onClick={handleAddNeighborhood}>
                                OK
                            </Button>
                        </div>
                    ) : (
                        <Select onValueChange={setSelectedNeighborhood} value={selectedNeighborhood}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todos os Bairros" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Bairros</SelectItem>
                                {availableNeighborhoods.map(n => (
                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Display filter */}
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
