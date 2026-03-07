'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendPasswordResetAction } from '../actions';
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SendPasswordResetButtonProps {
    email: string;
}

export function SendPasswordResetButton({ email }: SendPasswordResetButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleClick = async () => {
        setStatus('loading');
        setMessage('');
        const result = await sendPasswordResetAction(email);
        setStatus(result.ok ? 'ok' : 'error');
        setMessage(result.message);

        // Reseta após 6 segundos para permitir reenvio
        if (result.ok) {
            setTimeout(() => setStatus('idle'), 6000);
        }
    };

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={status === 'loading' || status === 'ok'}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 disabled:opacity-60"
            >
                {status === 'loading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'ok' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                    <KeyRound className="h-4 w-4" />
                )}
                {status === 'ok' ? 'Email enviado!' : 'Enviar recuperação de senha'}
            </Button>

            {message && (
                <p className={`flex items-center gap-1.5 text-xs ${status === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {status === 'ok' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {message}
                </p>
            )}
        </div>
    );
}
