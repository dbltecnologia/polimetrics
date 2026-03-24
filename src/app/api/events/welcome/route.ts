import { NextRequest, NextResponse } from 'next/server';
import { VirtualSecretaryEvents } from '@/services/ai/event-handler';

/**
 * POST /api/events/welcome
 * Body: { userId: string }
 *
 * Dispara a mensagem de boas-vindas via WhatsApp ao criar um novo líder.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
        }

        EventHandler.sendWelcomeMessage(userId).catch(
            (err) => console.error('[WELCOME_EVENT_ERROR]:', err)
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[WELCOME_API_ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
