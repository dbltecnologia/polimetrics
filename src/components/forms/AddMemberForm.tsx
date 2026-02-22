
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
import { useToast } from '@/components/ui/use-toast';
import { addMember } from '@/services/memberService';
import { addActivity } from '@/services/activityService';
import { useSession } from '@/context/session-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Por favor, insira um email válido.',
    }),
  whatsapp: z.string().trim().optional(),
  votePotential: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return 0;
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    },
    z.number().min(0, { message: 'Informe um número válido.' })
  ),
  cep: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{5}-?\d{3}$/.test(value), {
      message: 'CEP inválido. Ex: 65000-000',
    }),
  address: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  cityId: z.string(), // Adicionado
});

interface AddMemberFormProps {
  leaderId: string;
  cityId: string; // Adicionado
  onSuccess?: () => void;
}

export function AddMemberForm({ leaderId, cityId, onSuccess }: AddMemberFormProps) {
  const { user } = useSession(); // Pegar o usuário da sessão
  const { toast } = useToast();
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsapp: '',
      votePotential: 0,
      cep: '',
      address: '',
      bairro: '',
      instagram: '',
      facebook: '',
      cityId: cityId, // Pré-definido
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submit Iniciado. Valores:", values);
    if (!user) {
      console.error("Usuário não encontrado na sessão. Abortando submit.");
      return;
    }

    try {
      const newMember = {
        id: '',
        name: values.name,
        email: values.email || '',
        whatsapp: values.whatsapp || '',
        birthdate: '',
        experience: '',
        votePotential: Number(values.votePotential) || 0,
        cep: values.cep || '',
        address: values.address || '',
        cityId: values.cityId,
        bairro: values.bairro || '',
        leaderId,
        instagram: values.instagram || '',
        facebook: values.facebook || '',
      };

      const addedMemberRef = await addMember(newMember);

      await addActivity({
        leaderId: user.uid,
        supporterId: addedMemberRef.id,
        cityId: newMember.cityId,
        type: "add_supporter",
        description: `${user.displayName || 'Você'} adicionou o apoiador ${newMember.name}.`,
      });

      toast({
        title: "Sucesso!",
        description: "Novo apoiador cadastrado e atividade registrada.",
      });

      setIsSuccess(true);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh(); // Fallback para pages nativas Server-Side
      }

    } catch (error) {
      console.error("Erro ao cadastrar apoiador:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o cadastro. Tente novamente.",
        variant: 'destructive',
      });
    }
  }

  function onError(errors: any) {
    console.error("Erros de Validação do Zod:", errors);
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center h-full min-h-[350px]">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Apoiador Cadastrado!</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          O perfil foi salvo com sucesso e já contabiliza na sua rede.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            form.reset({
              name: '', email: '', whatsapp: '', votePotential: 0, cep: '', address: '', bairro: '', instagram: '', facebook: '', cityId,
            });
            setIsSuccess(false);
          }}
        >
          Fazer Novo Cadastro
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Maria Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(99) 99999-9999" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="number" min={0} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="65000-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
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
              <FormLabel>Endereço (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, complemento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="@usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="facebook.com/perfil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cityId"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Cadastrando...' : 'Cadastrar Apoiador'}
        </Button>
      </form>
    </Form>
  );
}
