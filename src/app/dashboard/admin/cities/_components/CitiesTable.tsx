'use client'

import { useState } from "react";
import { City } from "@/models/City";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { CityOverviewStats } from "@/services/admin/cities/getCitiesOverview";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CitiesTableProps {
  cities: City[];
  overview: Record<string, CityOverviewStats>;
}

function formatNumber(value: number) {
  return (Number(value) || 0).toLocaleString('pt-BR');
}

export function CitiesTable({ cities, overview }: CitiesTableProps) {
  const router = useRouter();

  const uniqueStates = Array.from(new Set(cities.map(c => c.state).filter(Boolean))).sort();
  // Mostra SOMENTE o estado atual, ou o primeiro estado se houver algum. 
  // O usuário pediu "o mesmo usuario consiga utilizar varios estados ao mesmo tempo. Vai ser apenas um switch".
  // Então o initial state será o primeiro estado ou "all" caso esteja vazio.
  const [selectedState, setSelectedState] = useState<string>(uniqueStates.length > 0 ? uniqueStates[0] : "all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCities = cities.filter(c => {
    const matchState = selectedState === "all" || c.state === selectedState;
    const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchState && matchName;
  });

  return (
    <div className="space-y-4 p-4 md:p-6 bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cidades ({filteredCities.length})</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {uniqueStates.map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cidade..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Visualização em Tabela para Desktops (lg) com scroll horizontal */}
      <div className="hidden lg:block overflow-x-auto rounded-md border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Nome</TableHead>
              <TableHead className="whitespace-nowrap">Estado</TableHead>
              <TableHead className="whitespace-nowrap text-right">Votos</TableHead>
              <TableHead className="whitespace-nowrap text-right">Líderes</TableHead>
              <TableHead className="whitespace-nowrap text-right">Apoiadores</TableHead>
              <TableHead className="whitespace-nowrap text-right">Demandas</TableHead>
              <TableHead className="whitespace-nowrap text-right">Engaj. 7d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities.map((city) => {
              const stats = overview[city.id] || {
                leaders: 0,
                supporters: 0,
                votePotential: 0,
                demandasAbertas: 0,
                demandasTotal: 0,
                engajamento7d: 0,
              };

              return (
                <TableRow
                  key={city.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/admin/cities/${city.id}`)}
                >
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.state}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(stats.votePotential)}</TableCell>
                  <TableCell className="text-right">{stats.leaders}</TableCell>
                  <TableCell className="text-right">{stats.supporters}</TableCell>
                  <TableCell className="text-right">
                    {stats.demandasAbertas}/{stats.demandasTotal}
                  </TableCell>
                  <TableCell className="text-right">{stats.engajamento7d}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* Visualização em Cartões para Dispositivos Móveis e Tablets (abaixo de lg) */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {filteredCities.map((city) => {
            const stats = overview[city.id] || {
              leaders: 0,
              supporters: 0,
              votePotential: 0,
              demandasAbertas: 0,
              demandasTotal: 0,
              engajamento7d: 0,
            };

            return (
              <Link
                key={city.id}
                href={`/dashboard/admin/cities/${city.id}`}
                className="block">

                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{city.name} - {city.state}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Votos</p>
                      <p className="mt-1 text-lg font-bold">{formatNumber(stats.votePotential)}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Engaj. 7d</p>
                      <p className="mt-1 text-lg font-bold">{stats.engajamento7d}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Líderes</p>
                      <p className="mt-1 text-lg font-bold">{stats.leaders}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Apoiadores</p>
                      <p className="mt-1 text-lg font-bold">{stats.supporters}</p>
                    </div>
                    <div className="col-span-2 rounded-xl border bg-muted/30 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Demandas</p>
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">{stats.demandasAbertas}</span> abertas ·{" "}
                        <span className="font-semibold">{stats.demandasTotal}</span> total
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
