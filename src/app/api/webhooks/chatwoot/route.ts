import { NextRequest, NextResponse } from 'next/server';
import { VirtualSecretary } from '@/services/ai/virtual-secretary';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const event = payload.event;

        // Só processamos mensagens criadas (recebidas)
        if (event !== 'message_created') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        // Ignorar se a mensagem for de saída (do atendente ou bot) ou nota privada
        if (payload.message_type !== 'incoming' || payload.private) {
            return NextResponse.json({ message: 'Not an incoming message' });
        }

        // Processar via Secretário Virtual
        // O processMessage é async, mas não precisamos esperar a resposta final do processamento
        // para dar o OK ao Chatwoot (evita timeout)
        VirtualSecretary.processMessage(payload).catch(err => {
            console.error('[CHATWOOT_WEBHOOK_ERROR]:', err);
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[CHATWOOT_WEBHOOK_FATAL]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
