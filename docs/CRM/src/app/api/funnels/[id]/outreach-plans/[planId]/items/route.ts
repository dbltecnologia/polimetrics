// src/app/api/funnels/[id]/outreach-plans/[planId]/items/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateOutreachPlanItem } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

// Update a specific item within an outreach plan
export async function PUT(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const { id: funnelId, planId } = context.params;
        const updatedItem = await request.json();

        if (!funnelId || !planId) {
            return NextResponse.json({ error: 'Funnel ID and Plan ID are required' }, { status: 400 });
        }
        if (!updatedItem || !updatedItem.leadId) {
            return NextResponse.json({ error: 'Updated item data with leadId is required' }, { status: 400 });
        }

        // TODO: Add ownership check to ensure user `uid` can write to this `funnelId`

        const result = await updateOutreachPlanItem(funnelId, planId, updatedItem);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
