// src/components/new-contact-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addContact, getCompanies } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Contact, Company } from '@/types/ai-types';

const contactFormSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface NewContactFormProps {
  funnelId: string | null;
  onSuccess: (newContact: Contact) => void;
}

export function NewContactForm({ funnelId, onSuccess }: NewContactFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', companyId: '' },
  });

  useEffect(() => {
    if (funnelId) {
      getCompanies(funnelId).then(setCompanies).catch(console.error);
    }
  }, [funnelId]);

  async function onSubmit(data: ContactFormValues) {
    if (!funnelId) {
      toast({ title: 'Erro', description: 'Funil não selecionado.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const newContact = await addContact(funnelId, data);
      toast({ title: 'Sucesso!', description: `Contato "${data.name}" criado.` });
      onSuccess(newContact);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao criar contato', variant: 'destructive' });
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
              <FormLabel>Nome do Contato</FormLabel>
              <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
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
              <FormControl><Input placeholder="joao.silva@empresa.com" {...field} /></FormControl>
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
              <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empresa (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Associar a uma empresa..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Contato
        </Button>
      </form>
    </Form>
  );
}
