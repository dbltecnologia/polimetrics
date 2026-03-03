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
import { formatPhone } from '@/utils/formatters';

const formSchema = z.object({
    name: z.string().min(2, { message: 'O nome é obrigatório.' }),
    phone: z.string().optional(),
    cityId: z.string().optional(),
    votePotential: z.coerce.number().min(0).default(0),
    status: z.enum(['ativo', 'inativo', 'potencial']).default('ativo'),
    leaderId: z.string().optional(),
    birthdate: z.string().optional(),
    notes: z.string().optional(),
});

interface MemberEditFormProps {
    member: {
        id: string;
        name?: string;
        phone?: string | null;
        cityId?: string;
        votePotential?: number;
        status?: string;
        leaderId?: string | null;
        birthdate?: string;
        notes?: string;
    };
    leaders: AppUser[];
    cities: { id: string; name: string; state: string }[];
}

export function MemberEditForm({ member, leaders, cities }: MemberEditFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: member.name || '',
            phone: member.phone || '',
            cityId: member.cityId || '',
            votePotential: member.votePotential || 0,
            status: (member.status as any) || 'ativo',
            leaderId: member.leaderId || '',
            birthdate: member.birthdate || '',
            notes: member.notes || '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/members/${member.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Erro ao atualizar membro.');
            }

            toast({ title: 'Membro atualizado com sucesso!' });
            router.push('/dashboard/admin/members');
            router.refresh();
        } catch (error: any) {
            console.error('Erro ao atualizar membro:', error);
            toast({
                title: 'Erro ao atualizar membro',
                description: error.message || 'Ocorreu um erro inesperado.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Membro</FormLabel>
                        <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="leaderId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Líder Responsável</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === 'no_selection' ? '' : v)} value={field.value || 'no_selection'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione o líder" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="no_selection">Sem líder</SelectItem>
                                {leaders.map(leader => (
                                    <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="cityId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === 'no_selection' ? '' : v)} value={field.value || 'no_selection'}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="no_selection">Não definido</SelectItem>
                                {cities.map(city => (
                                    <SelectItem key={city.id} value={city.id}>{city.name} - {city.state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>WhatsApp/Telefone</FormLabel>
                        <FormControl><Input placeholder="(99) 99999-9999" {...field} onChange={e => field.onChange(formatPhone(e.target.value))} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="votePotential" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Potencial de votos</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                <SelectItem value="potencial">Potencial</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="birthdate" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Data de nascimento (opcional)</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl><Input placeholder="Notas internas" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="flex gap-3">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                </div>
            </form>
        </Form>
    );
}
