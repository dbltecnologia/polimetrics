// src/app/api/funnels/[id]/leads/[leadId]/history/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { addInteractionToLead } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function POST(
    request: NextRequest,
    context: any
) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const { id: funnelId, leadId } = context.params;
        const interactionData = await request.json();

        if (!funnelId || !leadId) {
            return NextResponse.json({ error: 'Funnel ID and Lead ID are required' }, { status: 400 });
        }
        if (!interactionData || !interactionData.tipoInteracao || !interactionData.resumoInteracao) {
            return NextResponse.json({ error: 'Interaction data (tipoInteracao, resumoInteracao) is required' }, { status: 400 });
        }

        // We can pass the authenticated user info to the action
        const result = await addInteractionToLead(funnelId, leadId, {
            ...interactionData,
            userId: user.uid,
            userName: user.name || user.email || 'API User'
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Error in API route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
