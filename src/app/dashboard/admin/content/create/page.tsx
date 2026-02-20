'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { ContentGenerator } from '@/components/content/ContentGenerator';
import { ContentImageGenerator } from '@/components/content/ContentImageGenerator';
import { FreePromptTab } from '@/components/content/FreePromptTab';
import WizardClient from '../wizard/wizard_client';
import { AuditTab } from '@/components/content/AuditTab';
import { AdminHeader } from '@/app/dashboard/admin/_components/AdminHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContentCreatePage() {
  const [tab, setTab] = useState('wizard');

  return (
    <div className="w-full max-w-full md:max-w-5xl mx-auto px-3 md:px-8 space-y-6 overflow-x-hidden min-w-0">
      <AdminHeader
        title="Criar conteúdo com IA"
        subtitle="Wizard de kit completo, fluxo guiado de conteúdo e arte manual em um único lugar. Use a aba de prompt livre para testar modelos."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="md:hidden">
          <Select value={tab} onValueChange={setTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma seção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wizard">Wizard (kit completo)</SelectItem>
              <SelectItem value="conteudo">Conteúdo (texto + arte + áudio)</SelectItem>
              <SelectItem value="arte">Arte manual (canvas)</SelectItem>
              <SelectItem value="prompt">Prompt livre (texto)</SelectItem>
              <SelectItem value="audit">Auditoria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden w-full overflow-x-auto md:block">
          <TabsList className="flex w-full min-w-max gap-1 rounded-md bg-muted/40 p-1 md:grid md:min-w-0 md:grid-cols-5 md:w-auto md:gap-0 md:bg-transparent md:p-0">
            <TabsTrigger value="wizard" className="whitespace-nowrap px-3">Wizard (kit completo)</TabsTrigger>
            <TabsTrigger value="conteudo" className="whitespace-nowrap px-3">Conteúdo (texto + arte + áudio)</TabsTrigger>
            <TabsTrigger value="arte" className="whitespace-nowrap px-3">Arte manual (canvas)</TabsTrigger>
            <TabsTrigger value="prompt" className="whitespace-nowrap px-3">Prompt livre (texto)</TabsTrigger>
            <TabsTrigger value="audit" className="whitespace-nowrap px-3">Auditoria</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="wizard">
          <WizardClient />
        </TabsContent>

        <TabsContent value="conteudo">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="arte">
          <ContentImageGenerator />
        </TabsContent>

        <TabsContent value="prompt">
          <FreePromptTab />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
