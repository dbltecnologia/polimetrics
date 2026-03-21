// src/app/settings/profile/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, UserX } from 'lucide-react';
import { deactivateUserAccount } from '@/lib/actions';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ProfileSettingsPage() {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    if (!user) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const result = await deactivateUserAccount(user.uid);
            if (result.success) {
                await signOut(auth);
                toast({
                    title: 'Conta Desativada',
                    description: 'Sua conta foi desativada com sucesso. Você será redirecionado para a tela inicial.',
                });
                router.push('/');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Não foi possível desativar a conta no momento.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-medium tracking-tight">Minha Conta</h3>
                <p className="text-sm text-muted-foreground">Gerencie seus dados pessoais e exclusão de conta.</p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle>Dados Pessoais</CardTitle>
                        <CardDescription>Informações básicas do seu perfil.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-400">Nome</p>
                                <p className="text-base text-slate-200">{user.displayName || 'Usuário'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-400">Email</p>
                                <p className="text-base text-slate-200">{user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Zona de Perigo */}
                <Card className="border-red-900/30 bg-red-950/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600/50"></div>
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Zona de Perigo
                        </CardTitle>
                        <CardDescription className="text-red-400/70">Ações irreversiveis para a sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div>
                                <h4 className="text-base font-semibold text-slate-200">Desativar / Deletar Conta</h4>
                                <p className="text-sm text-slate-400 mt-1 max-w-lg">
                                    Esta ação desativará seu acesso à plataforma imediatamente. Seus dados permanecerão armazenados de forma restrita durante os prazos legais, mas não estarão mais acessíveis por você.
                                </p>
                            </div>
                            {!showConfirm ? (
                                <Button variant="destructive" onClick={() => setShowConfirm(true)} className="whitespace-nowrap bg-red-600 hover:bg-red-700">
                                    <UserX className="mr-2 h-4 w-4" /> Desativar Conta
                                </Button>
                            ) : (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isDeleting} className="border-slate-700 hover:bg-slate-800">
                                        Cancelar
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmar Exclusão
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
