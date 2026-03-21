// src/app/api/funnels/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDashboardData, renameFunnel, deleteFunnel } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

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

        const role = user.role || 'cliente';
        // getDashboardData now performs an authorization check and fetches all leads for accuracy.
        const funnelData = await getDashboardData(funnelId, user.uid, role);
        
        if (!funnelData || !funnelData.funnelName) {
            return NextResponse.json({ error: 'Funnel not found or access denied' }, { status: 404 });
        }
        
        return NextResponse.json(funnelData);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PUT(request: NextRequest, context: any) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const funnelId = context.params.id;
        const { name } = await request.json();

        if (!funnelId || !name) {
            return NextResponse.json({ error: 'Funnel ID and new name are required' }, { status: 400 });
        }

        // TODO: Add ownership check
        const result = await renameFunnel(funnelId, name);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest, context: any) {
     try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const funnelId = context.params.id;
        if (!funnelId) {
            return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
        }
        
        // TODO: Add ownership check
        await deleteFunnel(funnelId);
        return NextResponse.json({ success: true, message: 'Funnel deleted successfully' }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
