// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

// CPF validation utility
function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // all same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;

  return true;
}

// CPF mask: 000.000.000-00
function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

// Phone mask: (00) 00000-0000
function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned.length ? `(${cleaned}` : '';
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      toast({ title: 'Erro', description: 'Informe seu nome completo (nome e sobrenome).', variant: 'destructive' });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast({ title: 'Erro', description: 'Informe um número de telefone válido.', variant: 'destructive' });
      return;
    }

    if (!isValidCPF(cpf)) {
      toast({ title: 'Erro', description: 'CPF inválido. Verifique e tente novamente.', variant: 'destructive' });
      return;
    }

    if (!acceptedTerms) {
      toast({ title: 'Erro', description: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para se cadastrar.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile with display name
      await updateProfile(user, { displayName: fullName.trim() });

      // Create the user document in Firestore with all fields
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName.trim(),
        phone: cleanPhone,
        cpf: cpf.replace(/\D/g, ''),
        role: 'cliente',
        createdAt: serverTimestamp(),
        isNewUser: true,
        termsAcceptedAt: serverTimestamp(),
        termsVersion: '2026-02-18', // ou logar a versao dos termos atual
      });

      // Send email verification
      await sendEmailVerification(user);

      // Sign out to force re-login after verification
      await signOut(auth);

      toast({ title: 'Quase lá!', description: 'Sua conta foi criada. Enviamos um link de verificação para o seu e-mail. Confirme-o antes de tentar fazer login.' });
      router.push('/login');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let description = 'Ocorreu um erro ao criar sua conta.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A senha deve ter pelo menos 6 caracteres.';
      }
      toast({
        title: 'Erro de Cadastro',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = fullName.trim().length > 0 && email.length > 0 && phone.length >= 14 && cpf.length === 14 && password.length >= 6 && acceptedTerms;

  return (
    <div className="min-h-screen bg-[#0A0A12] text-slate-50 flex flex-col justify-center items-center py-12 px-6 relative overflow-x-hidden selection:bg-blue-500/30">
      {/* Background decorations */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

      <NextLink href="/" className="absolute top-8 left-8 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight z-10 hover:opacity-80 transition-opacity hidden sm:block">
        Agenticx.ia
      </NextLink>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-[#12121A]/80 border border-white/10 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500 tracking-tight">
                Agenticx.ia
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Crie sua Conta</h1>
            <p className="text-slate-400 text-sm">Comece a gerenciar seus leads de forma inteligente.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300 ml-1 text-sm">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nome e sobrenome"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 ml-1 text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300 ml-1 text-sm">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  disabled={isLoading}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-slate-300 ml-1 text-sm">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  disabled={isLoading}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 ml-1 text-sm">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 rounded-xl px-4"
              />
            </div>

            {/* Terms acceptance */}
            <div className="flex items-start space-x-3 pt-4 border-t border-white/5 mt-6">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                disabled={isLoading}
                className="mt-1 border-white/20 data-[state=checked]:bg-blue-600"
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                Li e aceito os{' '}
                <NextLink href="/termos-de-uso" target="_blank" className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors">
                  Termos de Uso
                </NextLink>{' '}
                e a{' '}
                <NextLink href="/politica-de-privacidade" target="_blank" className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors">
                  Política de Privacidade
                </NextLink>{' '}
                da Agenticx.ia. Compreendo que o uso indevido da plataforma está sujeito a penalidades criminais severas.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-xl mt-6 transition-all"
              disabled={isLoading || !isFormValid}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Criar Conta Grátis
            </Button>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-slate-400">
                Já tem uma conta?{' '}
                <NextLink href="/login" passHref>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 font-semibold hover:opacity-80 transition-opacity">
                    Faça login aqui
                  </span>
                </NextLink>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
