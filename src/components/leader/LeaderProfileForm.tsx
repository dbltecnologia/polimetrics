'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { City } from '@/types/city';
import { useUser } from '@/contexts/UserContext';

interface LeaderProfileFormProps {
  leaderId: string;
  cities: City[];
  initialCity?: string;
  initialParty?: string;
  initialBio?: string;
  initialInstagram?: string;
  initialFacebook?: string;
  initialAvatar?: string;
  initialCpf?: string;
  initialBairro?: string;
  initialAreaAtuacao?: string;
  initialLat?: number;
  initialLng?: number;
  onSuccess?: () => void;
}

export function LeaderProfileForm({
  leaderId,
  cities,
  initialCity = '',
  initialParty = '',
  initialBio = '',
  initialInstagram = '',
  initialFacebook = '',
  initialAvatar = '',
  initialCpf = '',
  initialBairro = '',
  initialAreaAtuacao = '',
  initialLat,
  initialLng,
  onSuccess,
}: LeaderProfileFormProps) {
  const { toast } = useToast();
  const { refresh } = useUser();
  const [city, setCity] = useState(initialCity);
  const [party, setParty] = useState(initialParty);
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [facebook, setFacebook] = useState(initialFacebook);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [cpf, setCpf] = useState(initialCpf);
  const [bairro, setBairro] = useState(initialBairro);
  const [areaAtuacao, setAreaAtuacao] = useState(initialAreaAtuacao);
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lng, setLng] = useState<number | undefined>(initialLng);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<'success' | 'error' | null>(null);
  const router = useRouter();

  const isFirstTime = useMemo(() => {
    return !initialCity && !initialParty && !initialBio && !initialInstagram && !initialFacebook && !initialAvatar;
  }, [initialCity, initialParty, initialBio, initialInstagram, initialFacebook, initialAvatar]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name)),
    [cities]
  );

  const parties = ['PSB', 'PL', 'PCdoB', 'PP', 'PDT'];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/leader/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: city,
          politicalParty: party,
          bio,
          instagram,
          facebook,
          avatarUrl: avatar,
          cpf,
          bairro,
          areaAtuacao,
          lat,
          lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar perfil');
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Agora você pode cadastrar membros com a cidade definida.',
        variant: 'default',
      });

      setStatus('Perfil atualizado com sucesso.');
      setStatusVariant('success');

      // Atualiza o UserContext para refletir avatar/links no Header imediatamente.
      await refresh();

      if (onSuccess) {
        onSuccess();
      } else if (isFirstTime) {
        router.push('/dashboard/leader-panel?welcome=1');
      }
    } catch (error) {
      console.error('[LeaderProfileForm]', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente em alguns segundos.',
        variant: 'destructive',
      });
      setStatus('Não foi possível salvar. Tente novamente.');
      setStatusVariant('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
      <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-white">
            {avatar ? (
              <AvatarImage src={avatar} alt="Avatar" />
            ) : (
              <AvatarFallback>{leaderId.slice(0, 2).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Seu perfil</p>
            <p className="text-lg font-semibold">Atualize e fortaleça sua base</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Complete os principais campos abaixo, conecte seus canais e habilite o cadastro de apoiadores na sua cidade.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cidade</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua cidade" />
              </SelectTrigger>
              <SelectContent>
                {sortedCities.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} • {option.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Partido</Label>
            <Select value={party} onValueChange={setParty}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um partido" />
              </SelectTrigger>
              <SelectContent>
                {parties.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bio</Label>
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Conte um pouco sobre você"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CPF</Label>
            <Input
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bairro de Atuação</Label>
            <Input
              value={bairro}
              onChange={(event) => setBairro(event.target.value)}
              placeholder="Ex: Centro, Cohab..."
            />
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Área de Atuação</Label>
          <Select value={areaAtuacao} onValueChange={setAreaAtuacao}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Igreja">Igreja</SelectItem>
              <SelectItem value="Escola">Escola</SelectItem>
              <SelectItem value="Feira">Feira</SelectItem>
              <SelectItem value="Comércio">Comércio</SelectItem>
              <SelectItem value="ONG">ONG</SelectItem>
              <SelectItem value="Associação">Associação M. / Sindicato</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Latitude (Lat)</Label>
            <Input
              type="number"
              step="any"
              value={lat ?? ''}
              onChange={(event) => setLat(parseFloat(event.target.value))}
              placeholder="-2.5..."
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Longitude (Lng)</Label>
            <Input
              type="number"
              step="any"
              value={lng ?? ''}
              onChange={(event) => setLng(parseFloat(event.target.value))}
              placeholder="-44.2..."
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Instagram</Label>
            <Input
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="@seuusuario"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Facebook</Label>
            <Input
              value={facebook}
              onChange={(event) => setFacebook(event.target.value)}
              placeholder="facebook.com/seuperfil"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Foto de perfil</Label>
          <div
            className="mt-2 flex items-center gap-4 rounded-lg border border-input bg-muted/30 p-3 transition hover:border-primary hover:bg-muted/50"
            onClick={handleAvatarClick}
          >
            <Avatar className="h-12 w-12 ring-2 ring-white bg-white">
              {avatar ? (
                <AvatarImage src={avatar} alt="Avatar" />
              ) : (
                <AvatarFallback>+</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clique para escolher uma foto</p>
              <p className="text-xs text-muted-foreground">Formatos permitidos: jpg, png, webp</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setAvatar(reader.result as string);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </Button>
            {status && (
              <span
                className={cn(
                  'text-sm',
                  statusVariant === 'success' ? 'text-emerald-600' : 'text-destructive'
                )}
              >
                {status}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Alterações podem demorar alguns segundos para aparecer em toda a plataforma.
          </p>
        </div>
      </form>
    </div>
  );
}
