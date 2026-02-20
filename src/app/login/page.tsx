
import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted">
      <Card className="w-full max-w-md p-6 sm:p-8 border shadow-lg rounded-lg bg-card">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Image src="/PoliMetrics.png" alt="Logo PoliMetrics" width={180} height={180} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PoliMetrics</h1>
          <CardDescription className="text-muted-foreground pt-1">
            Acesse sua área para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Suspense fallback={<div className="text-center text-muted-foreground">Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
        <CardFooter className="flex items-center justify-center text-sm mt-4">
          <p className="text-muted-foreground">
            Ainda não tem uma conta?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Cadastre-se agora
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
