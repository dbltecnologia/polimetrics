'use client';

import { useState } from 'react';
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

    const mappedLeaders = leaders.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number');
    const mappedMembers = members.filter(m => typeof m.lat === 'number' && typeof m.lng === 'number');

    const displayLeaders = filterType === 'all' || filterType === 'leaders' ? mappedLeaders : [];
    const displayMembers = filterType === 'all' || filterType === 'members' ? mappedMembers : [];

    return (
        <div className="space-y-5 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <Link href="/dashboard/admin/leaders" className="block outline-none">
                    <Card className="shadow-sm hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Líderes no Mapa</p>
                                <p className="text-2xl font-bold">{mappedLeaders.length}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full text-primary">
                                <MapPin className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>


                <Link href="/dashboard/admin/members" className="block outline-none">
                    <Card className="shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Apoiadores no Mapa</p>
                                <p className="text-2xl font-bold">{mappedMembers.length}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                                <User className="w-5 h-5" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <div className="hidden lg:block"></div>

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
