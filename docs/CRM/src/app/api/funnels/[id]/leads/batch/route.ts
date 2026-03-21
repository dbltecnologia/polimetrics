// src/app/api/funnels/[id]/leads/batch/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateLeadsStatus } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function PATCH(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const funnelId = context.params.id;
        const { leadIds, newStatus } = await request.json();

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ error: 'An array of leadIds is required' }, { status: 400 });
        }
        if (!newStatus) {
            return NextResponse.json({ error: 'A newStatus is required' }, { status: 400 });
        }

        // Note: A robust implementation would also check if the user owns the funnel.

        const result = await updateLeadsStatus(funnelId, leadIds, newStatus);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
