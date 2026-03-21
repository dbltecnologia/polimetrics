// src/components/new-lead-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addLeadToFunnel } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Lead } from '@/types/ai-types';

const leadSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }).optional().or(z.literal('')),
  phone: z.string().min(8, { message: "O telefone deve ter pelo menos 8 dígitos." }).optional().or(z.literal('')),
  address: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: "É necessário fornecer pelo menos um e-mail ou um telefone.",
  path: ["email"], // Show error under email field
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface NewLeadFormProps {
  funnelId: string | null;
  onSuccess: (newLead: Lead) => void;
}

export function NewLeadForm({ funnelId, onSuccess }: NewLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  async function onSubmit(data: LeadFormValues) {
    if (!funnelId) {
      toast({
        title: 'Erro',
        description: 'Nenhum funil ativo selecionado para adicionar o lead.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newLeadData = {
          ...data,
          title: data.name, // Use name as title for consistency
          statusFunil: 'Novo',
      };

      const newLead = await addLeadToFunnel(funnelId, newLeadData);

      toast({
        title: 'Sucesso!',
        description: `Lead "${data.name}" criado com sucesso.`,
      });
      onSuccess(newLead as Lead);
      form.reset();

    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao criar lead',
        description: 'Não foi possível salvar o novo lead.',
        variant: 'destructive',
      });
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
              <FormLabel>Nome / Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva ou Clínica Sorriso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="contato@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
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
              <FormControl>
                <Input placeholder="Ex: Rua das Flores, 123 - São Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !funnelId} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Lead
        </Button>
      </form>
    </Form>
  );
}
