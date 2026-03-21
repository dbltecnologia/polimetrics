// src/app/api/funnels/[id]/outreach-plans/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getOutreachPlans, saveOutreachPlan } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';


// GET all outreach plans for a funnel
export async function GET(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }

        const funnelId = context.params.id;
        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        
        // TODO: Add ownership check to ensure user `uid` can read this `funnelId`
        const plans = await getOutreachPlans(funnelId);
        return NextResponse.json(plans);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// POST a new outreach plan to a funnel
export async function POST(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }

        const funnelId = context.params.id;
        const planData = await request.json();

        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        if (!planData || !Array.isArray(planData) || planData.length === 0) {
            return NextResponse.json({ error: 'Plan data (array of leads) is required' }, { status: 400 });
        }
        
        // TODO: Add ownership check
        const result = await saveOutreachPlan(funnelId, planData);
        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
