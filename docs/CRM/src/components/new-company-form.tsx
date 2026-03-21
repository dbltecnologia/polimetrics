// src/components/new-company-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addCompany } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Company } from '@/types/ai-types';

const companyFormSchema = z.object({
  name: z.string().min(2, "O nome da empresa é obrigatório."),
  address: z.string().optional(),
  website: z.string().url("URL inválida.").optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface NewCompanyFormProps {
  funnelId: string | null;
  onSuccess: (newCompany: Company) => void;
}

export function NewCompanyForm({ funnelId, onSuccess }: NewCompanyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: '', address: '', website: '' },
  });

  async function onSubmit(data: CompanyFormValues) {
    if (!funnelId) {
      toast({ title: 'Erro', description: 'Funil não selecionado.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const newCompany = await addCompany(funnelId, data);
      toast({ title: 'Sucesso!', description: `Empresa "${data.name}" criada.` });
      onSuccess(newCompany);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao criar empresa', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl><Input placeholder="Rua das Flores, 123" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl><Input placeholder="https://acme.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Empresa
        </Button>
      </form>
    </Form>
  );
}
