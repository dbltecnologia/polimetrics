
import { Suspense } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50/40 p-4">
      <Card className="w-full max-w-md p-6 rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-blue-600">RECUPERAR SENHA</CardTitle>
          <CardDescription className="text-slate-500">
            Enviaremos um link de recuperação para o seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<div>Carregando...</div>}>
                 <ResetPasswordForm />
            </Suspense>
        </CardContent>
        <CardFooter className="flex items-center justify-center text-sm mt-6">
            <p className="text-slate-500">
                Lembrou sua senha?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Faça o login
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
