import { NextRequest, NextResponse } from 'next/server';
import { VirtualSecretary } from '@/services/ai/virtual-secretary';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // FIX #3: Validação de segurança — garantir que o payload vem da conta Chatwoot configurada.
        const expectedAccountId = process.env.CHATWOOT_ACCOUNT_ID;
        const payloadAccountId = payload.account?.id?.toString();
        if (expectedAccountId && payloadAccountId && payloadAccountId !== expectedAccountId) {
            console.warn('[CHATWOOT_WEBHOOK_SECURITY] account_id inválido:', payloadAccountId);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const event = payload.event;

        // Só processamos mensagens criadas (recebidas)
        if (event !== 'message_created') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        // Ignorar se a mensagem for de saída (do atendente ou bot) ou nota privada
        if (payload.message_type !== 'incoming' || payload.private) {
            return NextResponse.json({ message: 'Not an incoming message' });
        }

        // Processar via Secretário Virtual de forma assíncrona (evita timeout no Chatwoot)
        VirtualSecretary.processMessage(payload).catch(err => {
            console.error('[CHATWOOT_WEBHOOK_ERROR]:', err);
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[CHATWOOT_WEBHOOK_FATAL]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
