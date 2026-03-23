import { NextRequest, NextResponse } from 'next/server';
import { VirtualSecretary } from '@/services/ai/virtual-secretary';

/**
 * Webhook da Z-API — recebe mensagens de entrada do WhatsApp
 * 
 * Payload de referência:
 * https://developer.z-api.io/webhooks/on-message-received
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Z-API envia um payload diferente para cada tipo de evento.
        // Nos interessa apenas mensagens de texto recebidas (fromMe = false).
        const { phone, text, fromMe, isGroup, senderName } = payload;

        // Ignorar mensagens enviadas pelo próprio bot ou grupos
        if (fromMe || isGroup) {
            return NextResponse.json({ message: 'Ignored' });
        }

        // Ignorar se não houver texto (ex: áudio, imagem sem legenda)
        const content = text?.message;
        if (!content || !phone) {
            return NextResponse.json({ message: 'No text content' });
        }

        // Montar payload compatível com o VirtualSecretary
        // (mesmo formato que o Chatwoot, para reutilizar a mesma lógica)
        const secretaryPayload = {
            content,
            // Z-API usa conversationId baseado no número do telefone
            conversation: { id: phone },
            sender: {
                phone_number: phone,
                name: senderName || phone,
            },
            _source: 'zapi', // flag para saber o provedor de resposta
        };

        // Processar de forma assíncrona (evita timeout no webhook)
        VirtualSecretary.processMessage(secretaryPayload).catch(err => {
            console.error('[ZAPI_WEBHOOK_ERROR]:', err);
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[ZAPI_WEBHOOK_FATAL]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
