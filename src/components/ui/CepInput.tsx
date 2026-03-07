'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CepResult {
    cep: string;
    street: string;     // logradouro
    neighborhood: string; // bairro
    city: string;       // localidade
    state: string;      // uf
}

interface CepInputProps {
    /** Chamado quando o CEP é resolvido com sucesso */
    onResult: (result: CepResult) => void;
    /** CEP atual (opcional, para modo de edição) */
    defaultValue?: string;
    className?: string;
}

/**
 * CepInput — Preenchimento automático de endereço por CEP via ViaCEP.
 * Não requer chave de API. Ao digitar 8 dígitos (com ou sem traço),
 * consulta a API e chama onResult com os dados do endereço.
 */
export function CepInput({ onResult, defaultValue = '', className }: CepInputProps) {
    const [value, setValue] = useState(defaultValue);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const formatCep = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 8);
        return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    };

    const lookup = async (digits: string) => {
        setStatus('loading');
        setErrorMsg('');
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
            const data = await res.json();

            if (data.erro) {
                setStatus('error');
                setErrorMsg('CEP não encontrado.');
                return;
            }

            setStatus('ok');
            onResult({
                cep: data.cep,
                street: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || '',
            });
        } catch {
            setStatus('error');
            setErrorMsg('Erro ao consultar o CEP. Tente novamente.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCep(e.target.value);
        setValue(formatted);
        setStatus('idle');
        setErrorMsg('');

        const digits = formatted.replace(/\D/g, '');
        if (digits.length === 8) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => lookup(digits), 300);
        }
    };

    const iconMap = {
        idle: <MapPin className="h-4 w-4 text-muted-foreground" />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
        ok: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        error: <AlertCircle className="h-4 w-4 text-red-400" />,
    };

    return (
        <div className="space-y-1">
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    {iconMap[status]}
                </div>
                <Input
                    value={value}
                    onChange={handleChange}
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    className={`pl-9 ${className || ''}`}
                    autoComplete="postal-code"
                />
            </div>
            {status === 'loading' && (
                <p className="text-xs text-muted-foreground">Consultando CEP...</p>
            )}
            {status === 'ok' && (
                <p className="text-xs text-emerald-600">✓ Endereço preenchido automaticamente</p>
            )}
            {status === 'error' && (
                <p className="text-xs text-red-500">{errorMsg}</p>
            )}
        </div>
    );
}
