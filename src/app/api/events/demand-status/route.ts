import { NextRequest, NextResponse } from 'next/server';
import { VirtualSecretaryEvents } from '@/services/ai/event-handler';

/**
 * POST /api/events/demand-status
 * Body: { userId: string; chamadoId: string; newStatus: string; description?: string }
 *
 * Dispara notificação via WhatsApp quando o status de um chamado muda.
 * Chamado pelo Kanban de chamados no painel admin.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, chamadoId, newStatus, description } = await req.json();

        if (!userId || !chamadoId || !newStatus) {
            return NextResponse.json(
                { error: 'userId, chamadoId e newStatus são obrigatórios' },
                { status: 400 }
            );
        }

        // Dispara de forma assíncrona para não bloquear o response
        VirtualSecretaryEvents.onDemandStatusChanged(chamadoId, newStatus).catch(
            (err) => console.error('[DEMAND_STATUS_EVENT_ERROR]:', err)
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DEMAND_STATUS_API_ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
