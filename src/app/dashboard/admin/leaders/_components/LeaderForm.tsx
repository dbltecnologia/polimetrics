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
import { useState } from 'react';
import { AppUser } from '@/types/user';
// Corrigido: Importa as funções corretas do diretório de admin
import { addLeader } from '@/services/admin/leaders/createLeader';
import { updateLeader } from '@/services/admin/leaders/updateLeader';
import { CheckCircle2, MessageCircle } from 'lucide-react';

// Schema de validação unificado para criação e edição
const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  phone: z.string().optional(),
  role: z.enum(['master', 'sub', 'lider', 'leader'], { required_error: 'O tipo de líder é obrigatório.' }),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
  cityId: z.string().optional(),
  birthdate: z.string().optional(),
  experience: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().optional(), // Opcional, pois só é necessário na criação
  cpf: z.string().optional(),
  bairro: z.string().optional(),
  areaAtuacao: z.string().optional(),
  influencia: z.enum(['Baixo', 'Médio', 'Alto']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

interface LeaderFormProps {
  leader?: AppUser; // O líder existente para o modo de edição
  cities?: { id: string; name: string; state: string }[];
}

export function LeaderForm({ leader, cities = [] }: LeaderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [createdLeader, setCreatedLeader] = useState<{ name: string; email: string; password?: string } | null>(null);

  const isEditing = !!leader;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: leader?.name || '',
      email: leader?.email || '',
      phone: leader?.phone || '',
      role: (leader?.role as any) || undefined,
      status: ((leader as any)?.status as any) || 'ativo',
      cityId: (leader as any)?.cityId || '',
      birthdate: (leader as any)?.birthdate || '',
      experience: (leader as any)?.experience || '',
      notes: (leader as any)?.notes || '',
      password: '',
      cpf: (leader as any)?.cpf || '',
      bairro: (leader as any)?.bairro || '',
      areaAtuacao: (leader as any)?.areaAtuacao || '',
      influencia: (leader as any)?.influencia || undefined,
      lat: (leader as any)?.lat || undefined,
      lng: (leader as any)?.lng || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      let result;
      if (isEditing && leader) {
        // Modo de Edição: Chama a função de atualização correta
        result = await updateLeader(leader.id, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
          status: values.status,
          cityId: values.cityId || null,
          birthdate: values.birthdate || '',
          experience: values.experience || '',
          notes: values.notes || '',
          cpf: values.cpf || '',
          bairro: values.bairro || '',
          areaAtuacao: values.areaAtuacao || '',
          influencia: values.influencia || undefined,
          lat: values.lat,
          lng: values.lng,
        });
      } else {
        // Modo de Criação: Monta o FormData e chama a função de criação correta
        if (!values.password || values.password.length < 6) {
          throw new Error('A senha é obrigatória e deve ter pelo menos 6 caracteres.');
        }
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('phone', values.phone || '');
        formData.append('role', values.role);
        formData.append('status', values.status);
        formData.append('cityId', values.cityId || '');
        formData.append('birthdate', values.birthdate || '');
        formData.append('experience', values.experience || '');
        formData.append('notes', values.notes || '');
        formData.append('password', values.password);
        formData.append('cpf', values.cpf || '');
        formData.append('bairro', values.bairro || '');
        formData.append('areaAtuacao', values.areaAtuacao || '');
        if (values.influencia) formData.append('influencia', values.influencia);
        if (values.lat !== undefined) formData.append('lat', values.lat.toString());
        if (values.lng !== undefined) formData.append('lng', values.lng.toString());
        result = await addLeader(formData);
      }

      if (result.success) {
        toast({ title: result.message });
        router.refresh(); // Garante que a lista de líderes seja atualizada
        if (!isEditing) {
          setCreatedLeader({
            name: values.name,
            email: values.email,
            password: values.password
          });
        } else {
          router.push('/dashboard/admin/leaders');
        }
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} líder: `, error);
      toast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} líder`,
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (createdLeader) {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://mapa-politico.web.app/login';
    const message = `Olá, ${createdLeader.name}! Seu acesso à plataforma Inteligência Política foi criado.\n\nAcesso: ${loginUrl}\nLogin: ${createdLeader.email}\nSenha: ${createdLeader.password}\n\nGuarde bem essas informações!`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

    return (
      <div className="flex flex-col items-center justify-center space-y-5 p-8 border rounded-2xl bg-white text-center shadow-sm max-w-2xl">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Líder Criado com Sucesso!</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
            O acesso foi gerado e a célula está pronta para vincular novos Apoiadores.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl w-full max-w-sm text-left space-y-2">
          <p className="text-sm"><span className="font-semibold text-slate-700">Login:</span> <span className="text-slate-900">{createdLeader.email}</span></p>
          <p className="text-sm"><span className="font-semibold text-slate-700">Senha:</span> <span className="text-slate-900">{createdLeader.password}</span></p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Enviar Credenciais
            </a>
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/admin/leaders')}>
            Ver todos os Líderes
          </Button>
          <Button variant="ghost" onClick={() => { setCreatedLeader(null); form.reset(); }}>
            Criar Outro Líder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo</FormLabel>
            <FormControl><Input placeholder="Nome do líder" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} readOnly={isEditing} /></FormControl>
            {isEditing && <FormMessage>O email não pode ser alterado.</FormMessage>}
          </FormItem>
        )} />

        {!isEditing && (
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl><Input type="password" placeholder="Mínimo 6 caracteres" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl><Input placeholder="(99) 99999-9999" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Líder</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="sub">Subordinado</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cityId" render={({ field }) => (
          <FormItem>
            <FormLabel>Município</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value === "no_selection" ? "" : value)}
              defaultValue={field.value || "no_selection"}
            >
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="no_selection">Não definido</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - {c.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="birthdate" render={({ field }) => (
          <FormItem>
            <FormLabel>Data de nascimento</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="experience" render={({ field }) => (
          <FormItem>
            <FormLabel>Experiência na política</FormLabel>
            <FormControl><Input placeholder="Ex: 2 mandatos, liderança comunitária..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cpf" render={({ field }) => (
          <FormItem>
            <FormLabel>CPF</FormLabel>
            <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="bairro" render={({ field }) => (
          <FormItem>
            <FormLabel>Bairro Principal</FormLabel>
            <FormControl><Input placeholder="Ex: Centro, Cohab..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="areaAtuacao" render={({ field }) => (
          <FormItem>
            <FormLabel>Área de Atuação</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger></FormControl>
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
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="influencia" render={({ field }) => (
          <FormItem>
            <FormLabel>Grau de Influência</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Nível de alcance" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="lat" render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude (Lat)</FormLabel>
              <FormControl><Input type="number" step="any" placeholder="-2.5..." {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="lng" render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude (Lng)</FormLabel>
              <FormControl><Input type="number" step="any" placeholder="-44.2..." {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl><Input placeholder="Notas internas (opcional)" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Líder' : 'Criar Líder')}
        </Button>
      </form>
    </Form>
  );
}
