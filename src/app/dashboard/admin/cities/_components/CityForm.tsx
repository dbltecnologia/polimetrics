'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { City } from '@/models/City';
import { createCity } from '@/services/admin/cities/createCity';
import { updateCity } from '@/services/admin/cities/updateCity';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome da cidade é obrigatório.' }),
  state: z.string().min(2, { message: 'O estado é obrigatório (e.g., MA).' }).max(2, { message: 'Use a sigla do estado com 2 letras.' }),
  latitude: z.coerce.number({ required_error: 'A latitude é obrigatória.' }),
  longitude: z.coerce.number({ required_error: 'A longitude é obrigatória.' }),
});

interface CityFormProps {
  city?: City;
}

export function CityForm({ city }: CityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!city;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: city?.name || '',
      state: city?.state || '',
      latitude: city?.latitude || 0,
      longitude: city?.longitude || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateCity(city.id, values);
        toast({ title: "Cidade atualizada com sucesso!" });
      } else {
        await createCity(values);
        toast({ title: "Cidade criada com sucesso!" });
      }
      router.refresh();
      router.push('/dashboard/admin/cities');
    } catch (error) {
      console.error("Erro ao salvar cidade:", error);
      toast({ title: "Erro ao salvar cidade", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Cidade</FormLabel>
                <FormControl><Input placeholder="São Luís" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado (UF)</FormLabel>
                <FormControl><Input placeholder="MA" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="-2.53073" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl><Input type="number" step="any" placeholder="-44.3068" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Cidade')}
        </Button>
      </form>
    </Form>
  );
}
