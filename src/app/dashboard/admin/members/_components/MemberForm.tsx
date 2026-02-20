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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { AppUser } from '@/types/user';
import { createMember } from '@/services/admin/members/createMember';
import { getCities } from '@/services/city/client';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome é obrigatório.' }),
  phone: z.string().optional(),
  cityId: z.string({ required_error: 'Selecione a cidade.' }),
  votePotential: z.coerce.number().min(0).default(0),
  birthdate: z.string().optional(),
  experience: z.string().optional(),
  notes: z.string().optional(),
  leaderId: z.string({ required_error: 'É obrigatório vincular a um líder.' }),
});

interface MemberFormProps {
  leaders: AppUser[]; // A lista de líderes subordinados
}

export function MemberForm({ leaders }: MemberFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string; state: string }[]>([]);

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      cityId: '',
      votePotential: 0,
      birthdate: '',
      experience: '',
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await createMember(values);
      if (result.success) {
        toast({ title: "Membro adicionado com sucesso!" });
        router.refresh();
        router.push('/dashboard/admin/members');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error("Erro ao criar membro:", error);
      toast({ 
        title: "Erro ao criar membro", 
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Membro</FormLabel>
              <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="leaderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Líder Responsável</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o líder para este membro" /></SelectTrigger></FormControl>
                <SelectContent>
                  {leaders.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a cidade do apoiador" /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>{city.name} - {city.state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp/Telefone</FormLabel>
              <FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="votePotential"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potencial de votos</FormLabel>
              <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthdate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de nascimento (opcional)</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experiência na política (opcional)</FormLabel>
              <FormControl><Input placeholder="Ex: liderança comunitária..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl><Input placeholder="Notas internas" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Membro'}
        </Button>
      </form>
    </Form>
  );
}
