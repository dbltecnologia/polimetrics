
'use client'

import { useEffect, useState } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { getAllMembers } from "@/services/admin/members/getAllMembers";
import { getCities } from '@/services/city/client';
import { getLeaders, getLeadersByCity } from '@/services/leaderService';
import { Member } from '@/types/member';
import { City } from '@/types/city';
import { Leader } from '@/types/leader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Estendendo o tipo Member para incluir objetos aninhados
interface PopulatedMember extends Member {
    city?: City;
    leader?: Leader;
}

export default function AdminSupportersPage() {
    const [allMembers, setAllMembers] = useState<PopulatedMember[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [leadersInCity, setLeadersInCity] = useState<Leader[]>([]); // Líderes da cidade selecionada
    const [filteredMembers, setFilteredMembers] = useState<PopulatedMember[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [selectedLeader, setSelectedLeader] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [membersData, citiesData, leadersData] = await Promise.all([
                getAllMembers(),
                getCities(),
                getLeaders(),
            ]);

            const citiesMap = new Map(citiesData.map(c => [c.id, c]));
            const leadersMap = new Map(leadersData.map(l => [l.id, l]));

            // Para popular os nomes da cidade e do líder
            const populatedMembers = membersData.map(member => ({
                ...member,
                city: citiesMap.get(member.cityId as string) || undefined,
                leader: leadersMap.get(member.leaderId as string) || undefined,
            })) as unknown as PopulatedMember[];

            setAllMembers(populatedMembers);
            setFilteredMembers(populatedMembers); // Inicia com todos
            setCities(citiesData);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        let result = allMembers;

        if (selectedCity && selectedCity !== 'all') {
            result = result.filter(m => m.cityId === selectedCity);
        }

        if (selectedLeader && selectedLeader !== 'all') {
            result = result.filter(m => m.leaderId === selectedLeader);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(lowerCaseSearch) ||
                m.bairro?.toLowerCase().includes(lowerCaseSearch)
            );
        }
        setFilteredMembers(result);

    }, [selectedCity, selectedLeader, searchTerm, allMembers]);

    // Efeito para buscar líderes quando uma cidade é selecionada
    useEffect(() => {
        const fetchLeaders = async () => {
            if (selectedCity && selectedCity !== 'all') {
                const cityLeaders = await getLeadersByCity(selectedCity);
                setLeadersInCity(cityLeaders);
            } else {
                setLeadersInCity([]);
            }
            setSelectedLeader('all'); // Resetar seleção de líder ao mudar de cidade
        }

        fetchLeaders();
    }, [selectedCity]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Base de Apoiadores</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select onValueChange={setSelectedCity} value={selectedCity}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por Cidade" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>Todas as Cidades</SelectItem>
                        {cities.filter(c => c.id && c.name).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select onValueChange={setSelectedLeader} value={selectedLeader} disabled={!selectedCity || selectedCity === 'all'}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por Líder" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>Todos os Líderes</SelectItem>
                        {leadersInCity.filter(l => l.id && l.name).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Buscar por nome ou bairro..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <DataTable columns={columns} data={filteredMembers} />
        </div>
    )
}
