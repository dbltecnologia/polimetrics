// src/app/api/funnels/[id]/reports/outreaches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getOutreachPlans } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import type { OutreachItem } from '@/types/ai-types';

type EnrichedOutreachItem = OutreachItem & {
    planCreatedAt: Date;
    funnelId: string;
};

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    try {
        const { user, error, status: authStatus } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: authStatus || 401 });
        }

        const funnelId = context.params.id;
        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fetch the raw plan data
        const { data: plans } = await getOutreachPlans(funnelId);
        let allItems: EnrichedOutreachItem[] = [];

        for (const plan of plans) {
            const planItems = plan.planData.map((item: OutreachItem) => ({
                ...item,
                planCreatedAt: new Date(plan.createdAt.seconds * 1000),
                funnelId: funnelId,
            }));
            allItems = [...allItems, ...planItems];
        }

        // Apply filters
        let filteredItems = allItems;

        if (statusFilter && statusFilter !== 'Todos') {
            filteredItems = filteredItems.filter(item => item.status === statusFilter);
        }

        if (startDate) {
            try {
                const fromDate = new Date(startDate);
                filteredItems = filteredItems.filter(item => item.planCreatedAt >= fromDate);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' }, { status: 400 });
            }
        }
        if (endDate) {
            try {
                const toDate = new Date(endDate);
                toDate.setHours(23, 59, 59, 999); // Include the whole day
                filteredItems = filteredItems.filter(item => item.planCreatedAt <= toDate);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' }, { status: 400 });
            }
        }

        // Sort by date descending by default
        filteredItems.sort((a, b) => b.planCreatedAt.getTime() - a.planCreatedAt.getTime());
        
        return NextResponse.json({ data: filteredItems, total: filteredItems.length });

    } catch (error: any) {
        console.error('Error in outreach report API route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
