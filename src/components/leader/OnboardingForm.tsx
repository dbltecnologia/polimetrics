'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { City } from '@/types/city';

interface OnboardingFormProps {
  leaderId: string;
  leaderName: string;
  cities: City[];
}

export function OnboardingForm({ leaderId, leaderName, cities }: OnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [experience, setExperience] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [cityId, setCityId] = useState<string>(cities[0]?.id || '');
  const [firstMemberName, setFirstMemberName] = useState('');
  const [firstMemberWhatsapp, setFirstMemberWhatsapp] = useState('');
  const [firstMemberVotePotential, setFirstMemberVotePotential] = useState('');
  const profileComplete = Boolean(experience.trim() && instagram.trim() && facebook.trim() && cityId);
  const memberComplete = Boolean(firstMemberName.trim() && firstMemberWhatsapp.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!firstMemberName.trim() || !firstMemberWhatsapp.trim()) {
      toast({
        title: 'Atenção',
        description: 'Preencha nome e WhatsApp do primeiro membro para concluir o onboarding.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const profileRes = await fetch('/api/leader/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience,
          instagram,
          facebook,
          cityId,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Não foi possível atualizar o perfil.');
      }

      const memberRes = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firstMemberName,
          whatsapp: firstMemberWhatsapp,
          votePotential: Number(firstMemberVotePotential) || 0,
          leaderId,
          cityId,
        }),
      });

      if (!memberRes.ok) {
        const error = await memberRes.json().catch(() => ({}));
        throw new Error(error.error || 'Erro ao cadastrar primeiro membro.');
      }

      toast({
        title: 'Perfil completo',
        description: 'Seu onboarding foi concluído. Bem-vindo à plataforma.',
      });
      router.push('/dashboard/leader/welcome');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível concluir o onboarding.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Onboarding de {leaderName}</CardTitle>
        <div className="grid gap-2 md:grid-cols-2">
          <div className={`rounded-lg border px-3 py-2 text-sm ${profileComplete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            Perfil: {profileComplete ? 'Campos básicos preenchidos' : 'Preencha experiência, redes sociais e cidade'}
          </div>
          <div className={`rounded-lg border px-3 py-2 text-sm ${memberComplete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            Primeiro membro: {memberComplete ? 'Ok' : 'Obrigatório (nome + WhatsApp)'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label>Experiência política resumida</Label>
            <Textarea
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              placeholder="Conte um pouco sobre sua trajetória..."
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Instagram</Label>
              <Input
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                placeholder="@seuusuario"
                required
              />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input
                value={facebook}
                onChange={(event) => setFacebook(event.target.value)}
                placeholder="facebook.com/seu-perfil"
                required
              />
            </div>
          </div>
          <div>
            <Label>Cidade base</Label>
            <Select value={cityId} onValueChange={(val) => setCityId(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} · {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Cadastrar primeiro membro</p>
            <p className="text-xs text-muted-foreground">
              Obrigatório para liberar o painel. Você pode editar os dados depois.
            </p>
            <div>
              <Label>Nome do apoiador</Label>
              <Input
                value={firstMemberName}
                onChange={(event) => setFirstMemberName(event.target.value)}
                placeholder="Nome completo"
              required
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={firstMemberWhatsapp}
                onChange={(event) => setFirstMemberWhatsapp(event.target.value)}
                placeholder="+55 (99) 9 9999-9999"
                required
              />
            </div>
            <div>
              <Label>Potencial de votos</Label>
              <Input
                type="number"
                min={0}
                value={firstMemberVotePotential}
                onChange={(event) => setFirstMemberVotePotential(event.target.value)}
                placeholder="Ex: 5"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O cadastro do primeiro membro é opcional, mas desbloqueia o dashboard automaticamente.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Finalizando...' : 'Concluir onboarding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
