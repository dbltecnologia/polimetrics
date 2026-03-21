// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [showResendBox, setShowResendBox] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);

  const handleResendEmail = async () => {
    if (!unverifiedUser || isResending) return;
    setIsResending(true);
    try {
      await sendEmailVerification(unverifiedUser);
      toast({
        title: 'E-mail reenviado!',
        description: 'Enviamos um novo link de verificação. Verifique sua caixa de entrada e spam.',
      });
      setShowResendBox(false); // Oculta a box após o envio (debounce implícito, usuário tem que logar de novo pra aparecer)
      await signOut(auth); // Desloga imediatamente
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        toast({ title: 'Aguarde', description: 'Muitas tentativas. Aguarde 1 minuto para reenviar.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: 'Erro ao reenviar: ' + error.message, variant: 'destructive' });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        setShowResendBox(true);
        // Não desloga AINDA, pois o sendEmailVerification precisa do userContextativo
        // Mas paramos a execução para não ir pro /dashboard
        toast({
          title: 'Acesso Negado',
          description: 'Por favor, verifique seu e-mail antes de fazer login. Verifique sua caixa de entrada e spam.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Sucesso!', description: 'Login realizado com sucesso. Carregando painel...' });
      // Redirecionamento removido: O RootLayout vai reagir ao AuthContext quando o getDoc for finalizado e mudará a página sem race condition.
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro de Login',
        description: error.message.includes('auth/invalid-credential')
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
          : 'Ocorreu um erro ao tentar fazer login.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
    // omitimos o finally { setIsLoading(false); } para não piscar o loader enquanto o layout redireciona
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
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Bem-vindo de volta</h1>
            <p className="text-slate-400 text-sm">Faça login para acessar seu painel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-300 text-sm">Senha</Label>
                  <NextLink href="/forgot-password" passHref>
                    <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Esqueceu a senha?</span>
                  </NextLink>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              Entrar no Painel
            </Button>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-slate-400">
                Não tem uma conta?{' '}
                <NextLink href="/signup" passHref>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 font-semibold hover:opacity-80 transition-opacity">Cadastre-se grátis</span>
                </NextLink>
              </p>
            </div>

            {showResendBox && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-950/40 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-200 mb-3 text-center">
                  Ainda não verificou seu e-mail? Não feche esta tela, clique abaixo para reenviar o link.
                </p>
                <Button type="button" variant="outline" onClick={handleResendEmail} disabled={isResending} className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reenviar e-mail de verificação
                </Button>
              </motion.div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
