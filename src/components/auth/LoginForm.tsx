'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from 'next/navigation'; // Importa o useRouter
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { normalizeRole } from "@/lib/role-utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Instancia o router

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha na comunicação com o servidor.' }));
        setError(errorData.error || 'E-mail ou senha inválidos.');
        return;
      }

      const data = await response.json();

      const normalizedRole = normalizeRole(data.role);
      const redirectPath = normalizedRole === 'admin' ? '/dashboard/admin' : '/welcome';
      window.location.assign(redirectPath);
      return;

    } catch (err: any) {
      console.error("Login Error:", err, "Code:", err.code);
      const errorMessage =
        err?.code === "auth/user-not-found" ||
          err?.code === "auth/wrong-password" ||
          err?.code === "auth/invalid-credential"
          ? "E-mail ou senha inválidos."
          : err?.message
            ? `Ocorreu um erro: ${err.message}`
            : 'Não foi possível autenticar. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const fillDemoCredentials = (role: 'admin' | 'lider') => {
    if (role === 'admin') {
      form.setValue('email', 'admin@polimetrics.com');
      form.setValue('password', 'password123');
    } else {
      form.setValue('email', 'lider@polimetrics.com');
      form.setValue('password', 'password123');
    }
    // Opcional: já acionar o submit automaticamente
    // form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-600">Email</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-600">Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <div className="text-right pt-1">
                <Link href="/reset-password" className="text-xs text-slate-500 hover:text-blue-600 hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-center text-sm font-medium">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Iniciando sessão..." : "Acessar"}
        </Button>

        {/* Botões de Acesso Rápido para Testes */}
        <div className="pt-4 border-t mt-6 border-slate-100 space-y-3">
          <p className="text-xs text-center text-slate-400 font-medium">✨ Acesso Rápido (Dev)</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                fillDemoCredentials('admin');
                setTimeout(() => form.handleSubmit(onSubmit)(), 100);
              }}
              disabled={isLoading}
            >
              Acessar como Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                fillDemoCredentials('lider');
                setTimeout(() => form.handleSubmit(onSubmit)(), 100);
              }}
              disabled={isLoading}
            >
              Acessar como Líder
            </Button>
          </div>
        </div>

      </form>
    </Form>
  );
}
