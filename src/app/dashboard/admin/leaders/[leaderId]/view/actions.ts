'use server';

import { auth } from '@/lib/firebase-admin';

/**
 * Envia email de recuperação de senha para o email informado.
 * Usa o Firebase Admin Auth SDK (generatePasswordResetLink) + nodemailer ou
 * o próprio mecanismo do Firebase (sendPasswordResetEmail via REST API).
 * Retorna { ok, message }.
 */
export async function sendPasswordResetAction(email: string): Promise<{ ok: boolean; message: string }> {
    if (!email?.trim()) {
        return { ok: false, message: 'Email não informado.' };
    }

    try {
        // Gera o link de reset pelo Admin SDK
        const resetLink = await auth.generatePasswordResetLink(email.trim());

        // Envia o email via Firebase Auth REST API
        // (alternativa sem servidor SMTP: usa o próprio serviço do Firebase)
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) throw new Error('FIREBASE_API_KEY não configurada');

        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestType: 'PASSWORD_RESET',
                    email: email.trim(),
                }),
            }
        );

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || 'Erro ao enviar email');
        }

        return { ok: true, message: `Email de recuperação enviado para ${email}` };
    } catch (err: any) {
        console.error('[sendPasswordReset]', err);
        const msg = err?.message || 'Erro desconhecido';
        if (msg.includes('EMAIL_NOT_FOUND')) {
            return { ok: false, message: 'Email não encontrado no sistema.' };
        }
        return { ok: false, message: `Falha ao enviar: ${msg}` };
    }
}
