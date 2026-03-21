// src/app/api/funnels/[id]/stages/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateFunnelStages } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';


export async function PUT(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const funnelId = context.params.id;
        const { stages } = await request.json();

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        if (!stages || !Array.isArray(stages)) {
            return NextResponse.json({ error: 'An array of stages is required' }, { status: 400 });
        }

        // TODO: Add ownership check
        const result = await updateFunnelStages(funnelId, stages);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
