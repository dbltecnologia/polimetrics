'use client'

import { City } from "@/models/City";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityOverviewStats } from "@/services/admin/cities/getCitiesOverview";
import Link from 'next/link';

interface CitiesTableProps {
  cities: City[];
  overview: Record<string, CityOverviewStats>;
}

function formatNumber(value: number) {
  return (Number(value) || 0).toLocaleString('pt-BR');
}

export function CitiesTable({ cities, overview }: CitiesTableProps) {

  return (
    <div>
      {/* Visualização em Tabela para Desktops (lg) com scroll horizontal */}
      <div className="hidden lg:block overflow-x-auto">
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
            {cities.map((city) => {
              const stats = overview[city.id] || {
                leaders: 0,
                supporters: 0,
                votePotential: 0,
                demandasAbertas: 0,
                demandasTotal: 0,
                engajamento7d: 0,
              };

              return (
                <Link key={city.id} href={`/dashboard/admin/cities/${city.id}`} passHref legacyBehavior>
                  <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
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
                </Link>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Visualização em Cartões para Dispositivos Móveis e Tablets (abaixo de lg) */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {cities.map((city) => {
            const stats = overview[city.id] || {
              leaders: 0,
              supporters: 0,
              votePotential: 0,
              demandasAbertas: 0,
              demandasTotal: 0,
              engajamento7d: 0,
            };

            return (
              <Link key={city.id} href={`/dashboard/admin/cities/${city.id}`} className="block">
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
