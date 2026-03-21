// src/app/api/funnels/[id]/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { addLeadToFunnel } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const funnelId = context.params.id;
        const leadData = await request.json();

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        if (!leadData || Object.keys(leadData).length === 0) {
            return NextResponse.json({ error: 'Lead data is required' }, { status: 400 });
        }

        // TODO: Add ownership check to ensure user `uid` can write to this `funnelId`

        const newLead = await addLeadToFunnel(funnelId, leadData);
        return NextResponse.json(newLead, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
