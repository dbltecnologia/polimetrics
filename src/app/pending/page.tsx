import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PendingPage() {
    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-muted">
            <Card className="w-full max-w-md p-6 sm:p-8 border shadow-lg rounded-lg bg-card text-center">
                <CardHeader className="pb-4">
                    <div className="flex justify-center mb-4">
                        <Image src="/Zero1DosVotos.png" alt="Logo Zero1DosVotos" width={120} height={120} className="object-contain" />
                    </div>
                    <div className="flex justify-center mb-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                            <Clock className="h-8 w-8 text-amber-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Cadastro em Análise</h1>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Sua conta foi criada com sucesso! Um administrador irá verificar seus dados e liberar o acesso em breve.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Você receberá acesso ao sistema assim que seu cadastro for aprovado. Tente fazer login novamente mais tarde.
                    </p>
                    <Button asChild variant="outline" className="w-full mt-4">
                        <Link href="/login">Voltar ao Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
