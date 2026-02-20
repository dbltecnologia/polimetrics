'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsOfUseProps {
  onAccept: () => void;
}

export function TermsOfUse({ onAccept }: TermsOfUseProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Termos de Uso e Consentimento</CardTitle>
        <CardDescription>Leia atentamente antes de prosseguir com o cadastro.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          <h3 className="font-semibold mb-2">1. Coleta e Uso de Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ao continuar, você, na qualidade de líder comunitário, confirma que possui o consentimento explícito do cidadão para coletar e armazenar as informações pessoais fornecidas, incluindo nome, data de nascimento, endereço, e-mail e telefone. Estes dados serão utilizados exclusivamente para fins de organização comunitária, mobilização e comunicação relacionadas às atividades da nossa plataforma.
          </p>
          
          <h3 className="font-semibold mb-2">2. Permissões Solicitadas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            O cidadão autoriza o contato por meio de WhatsApp, E-mail e SMS para recebimento de convites para eventos, notícias e outras comunicações relevantes para a comunidade.
          </p>

          <h3 className="font-semibold mb-2">3. Confidencialidade e Segurança</h3>
          <p className="text-sm text-muted-foreground">
            Asseguramos que todos os dados coletados serão tratados com a máxima confidencialidade e segurança, em conformidade com a Lei Geral de Proteção de Dados (LGPD). As informações não serão compartilhadas com terceiros sem o consentimento prévio do titular.
          </p>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={onAccept} className="w-full">Li e concordo</Button>
      </CardFooter>
    </Card>
  );
}