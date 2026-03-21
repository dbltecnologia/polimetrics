// src/components/new-opportunity-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addLeadToFunnel, getCompanies, getContacts } from '@/lib/actions';
import { Loader2, PlusCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Lead, Company, Contact } from '@/types/ai-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { NewContactForm } from './new-contact-form';
import { NewCompanyForm } from './new-company-form';

const opportunitySchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  value: z.coerce.number().optional(),
  statusFunil: z.string().min(1, 'A etapa inicial é obrigatória.'),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface NewOpportunityFormProps {
  uploadId: string | null;
  stages: string[];
  onSuccess: (newLead: Lead, keepOpen?: boolean) => void;
}

export function NewOpportunityForm({ uploadId, stages, onSuccess }: NewOpportunityFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAndNew, setIsSubmittingAndNew] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      companyId: '',
      contactId: '',
      value: 0,
      statusFunil: stages[0] || '',
    },
  });

  const fetchDependencies = useCallback(async () => {
    if (!uploadId) return;
    try {
      const [companiesData, contactsData] = await Promise.all([
        getCompanies(uploadId),
        getContacts(uploadId)
      ]);
      setCompanies(companiesData);
      setContacts(contactsData);
      setFilteredContacts(contactsData); // Initially show all contacts
    } catch (error) {
      console.error("Failed to fetch companies or contacts", error);
      toast({ title: "Erro ao carregar dependências", variant: "destructive" });
    }
  }, [uploadId, toast]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const selectedCompanyId = form.watch('companyId');

  useEffect(() => {
    if (selectedCompanyId) {
      setFilteredContacts(contacts.filter(c => c.companyId === selectedCompanyId));
    } else {
      setFilteredContacts(contacts);
    }
  }, [selectedCompanyId, contacts]);

  const handleCompanyChange = (companyId: string) => {
    form.setValue('companyId', companyId);
    // Reset contact if it doesn't belong to the new company
    const currentContactId = form.getValues('contactId');
    if (currentContactId && !contacts.find(c => c.id === currentContactId && c.companyId === companyId)) {
      form.setValue('contactId', '');
    }
  };

  const handleContactChange = (contactId: string) => {
    form.setValue('contactId', contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact?.companyId && form.getValues('companyId') !== contact.companyId) {
      form.setValue('companyId', contact.companyId);
    }
  };

  const onSubmit = (data: OpportunityFormValues) => processSubmit(data, false);

  async function processSubmit(data: OpportunityFormValues, addAnother: boolean = false) {
    if (!uploadId) {
      toast({
        title: 'Erro',
        description: 'Nenhum funil ativo selecionado.',
        variant: 'destructive',
      });
      return;
    }

    if (addAnother) {
      setIsSubmittingAndNew(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      const newLeadData = {
        ...data,
      };

      const newLead = await addLeadToFunnel(uploadId, newLeadData);

      toast({
        title: 'Sucesso!',
        description: `Oportunidade "${data.title}" criada.`,
      });

      onSuccess(newLead as Lead, addAnother);

      if (addAnother) {
        form.reset({
          ...form.getValues(),
          title: '', // Only reset the title and value, keep company/contact/stage if they want to add multiple for same company
          value: 0
        });
        // Focus the title input again (hacky but works natively by re-rendering)
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
        }, 100);
      }

    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao criar oportunidade',
        description: 'Não foi possível salvar o novo lead.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsSubmittingAndNew(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Negócio</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Contrato de Manutenção" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={handleCompanyChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
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
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsCompanyModalOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={handleContactChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} {contact.companyId && `(${companies.find(c => c.id === contact.companyId)?.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsContactModalOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Negócio (R$)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0,00" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusFunil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etapa Inicial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="button" variant="outline" onClick={form.handleSubmit((d) => processSubmit(d, true))} disabled={isSubmitting || isSubmittingAndNew} className="w-full sm:w-1/2 bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl">
              {isSubmittingAndNew && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Adicionar Outro
            </Button>
            <Button type="submit" disabled={isSubmitting || isSubmittingAndNew} className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] border-0">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e Fechar
            </Button>
          </div>
        </form>
      </Form>

      {/* Modals for creating new entities */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Empresa</DialogTitle>
          </DialogHeader>
          <NewCompanyForm
            funnelId={uploadId}
            onSuccess={(newCompany) => {
              setCompanies(prev => [...prev, newCompany]);
              form.setValue('companyId', newCompany.id);
              setIsCompanyModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Contato</DialogTitle>
          </DialogHeader>
          <NewContactForm
            funnelId={uploadId}
            onSuccess={(newContact) => {
              setContacts(prev => [...prev, newContact]);
              form.setValue('contactId', newContact.id);
              if (newContact.companyId) {
                form.setValue('companyId', newContact.companyId);
              }
              setIsContactModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
