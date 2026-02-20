'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FilterValues {
  startDate?: string;
  endDate?: string;
  name?: string;
  region?: string;
}

interface FilterFormProps {
  onSubmit: (filters: FilterValues) => void;
}

export function FilterForm({ onSubmit }: FilterFormProps) {
  const [filters, setFilters] = useState<FilterValues>({});

  const handleChange = (name: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(filters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">De</Label>
              <Input id="startDate" type="date" onChange={(e) => handleChange('startDate', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Até</Label>
              <Input id="endDate" type="date" onChange={(e) => handleChange('endDate', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Filtrar por nome..." onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="region">Região Administrativa</Label>
            <Select onValueChange={(value) => handleChange('region', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="plano-piloto">Plano Piloto</SelectItem>
                    <SelectItem value="taguatinga">Taguatinga</SelectItem>
                    <SelectItem value="ceilandia">Ceilândia</SelectItem>
                    <SelectItem value="guara">Guará</SelectItem>
                    {/* Adicionar outras regiões conforme necessário */}
                </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Aplicar Filtros</Button>
        </form>
      </CardContent>
    </Card>
  );
}
