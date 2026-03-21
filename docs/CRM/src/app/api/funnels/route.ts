
// src/app/api/funnels/route.ts
import { NextResponse } from 'next/server';
import { getFunnels, createFunnel } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import type { NextRequest } from 'next/server';


export async function GET(request: NextRequest) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);

        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }

        const { searchParams } = new URL(request.url);
        const ownerId = searchParams.get('ownerId');

        if (!ownerId) {
            return NextResponse.json({ error: 'ownerId is a required query parameter.' }, { status: 400 });
        }
        
        // A lógica de role é removida. A função agora depende do ownerId explícito.
        const funnelsData = await getFunnels(ownerId);
        return NextResponse.json(funnelsData.data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Funnel name is required' }, { status: 400 });
        }

        const newFunnel = await createFunnel(name, user.uid, user.email || '');
        return NextResponse.json(newFunnel, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

    