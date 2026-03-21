
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getInstanceConnectionState } from '@/lib/actions';
import type { MessagingInstance } from '@/lib/actions';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';

interface QrCodeModalProps {
  instance: MessagingInstance;
  onConnected: () => void; // Callback to notify the parent component that the connection was successful
}

export function QrCodeModal({ instance, onConnected }: QrCodeModalProps) {
  const [status, setStatus] = useState<'loading' | 'qrcode' | 'connected' | 'error'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!instance?.name || !isPolling) return;

    try {
      const result = await getInstanceConnectionState(instance.name, instance.provider, instance.config);

      if (result.success) {
        const state = result.data?.instance?.state || result.data?.state;

        if (state === 'open') {
          setStatus('connected');
          setIsPolling(false);
          onConnected();
        } else if (result.data?.base64) {
          setStatus('qrcode');
          setQrCode(result.data.base64);
        } else {
          // Continua em 'loading' se a instância existe mas o QR code não está pronto.
          // Não reseta o status para 'loading' se já estamos mostrando um QR code.
          if (status !== 'qrcode') {
            setStatus('loading');
          }
        }
      } else {
        setStatus('error');
        setErrorMessage(result.message);
        setIsPolling(false);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || 'An unknown error occurred.');
      setIsPolling(false);
    }
  }, [instance?.name, onConnected, isPolling, status, instance.provider, instance.config]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isPolling) {
      checkStatus(); // Initial check
      intervalId = setInterval(checkStatus, 1500); // Poll every 1.5 seconds (Aggressive Polling)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, checkStatus]);

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400">A obter estado da instância...</p>
        </>
      )}
      {status === 'qrcode' && qrCode && (
        <>
          <h3 className="text-lg font-semibold mb-2 text-white">Leia o QR Code para Conectar</h3>
          <p className="text-sm text-slate-400 mb-4 text-center">Abra o WhatsApp no seu telemóvel e vá a Dispositivos conectados.</p>
          <div className="bg-white p-2 rounded-xl">
            <Image src={qrCode} alt="QR Code do WhatsApp" width={250} height={250} className="rounded-lg" />
          </div>
        </>
      )}
      {status === 'connected' && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <CheckCircle className="h-16 w-16 text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
          <h3 className="text-lg font-semibold text-white">Dispositivo Conectado!</h3>
          <p className="text-sm text-slate-400 mt-1">Pode fechar esta janela.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          <h3 className="text-lg font-semibold text-white">Ocorreu um Erro</h3>
          <p className="text-sm text-red-400 mt-2 mb-6 max-w-xs">{errorMessage}</p>
          <Button variant="outline" onClick={() => { setIsPolling(true); setStatus('loading'); }} className="bg-transparent border-white/20 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}
