// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSent(true);
            toast({ title: 'Sucesso!', description: 'Verifique seu e-mail com as instruções de redefinição.' });
        } catch (error: any) {
            console.error('Erro na redefinição:', error);
            toast({
                title: 'Erro de Redefinição',
                description: error.message.includes('auth/user-not-found')
                    ? 'Não encontramos nenhum usuário com este e-mail.'
                    : 'Ocorreu um erro ao tentar enviar o e-mail de redefinição.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A12] text-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden selection:bg-blue-500/30">
            {/* Background decorations */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

            <NextLink href="/" className="absolute top-8 left-8 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight z-10 hover:opacity-80 transition-opacity hidden sm:block">
                Agenticx.ia
            </NextLink>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-[#12121A]/80 border border-white/10 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="mb-6 flex justify-center">
                            <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight">
                                Agenticx.ia
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Esqueceu a senha?</h1>
                        <p className="text-slate-400 text-sm">Insira seu e-mail para receber um link de redefinição.</p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-300 ml-1 text-sm">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-xl mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : null}
                                Enviar Link de Redefinição
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                                O link foi enviado para o seu e-mail. Por favor, verifique sua caixa de entrada e spam.
                            </div>
                            <Button
                                onClick={() => router.push('/login')}
                                variant="ghost"
                                className="w-full text-slate-300 hover:text-white"
                            >
                                Voltar ao Login
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-slate-400">
                            Lembrou sua senha?{' '}
                            <NextLink href="/login" passHref>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 font-semibold hover:opacity-80 transition-opacity">Volte e faça login</span>
                            </NextLink>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
