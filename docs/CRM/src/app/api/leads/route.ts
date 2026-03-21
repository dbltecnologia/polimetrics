// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { searchLeads } from '@/lib/actions';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { user, error, status } = await getAuthenticatedUser(request);
        if (error || !user) {
            return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone') || undefined;
        const email = searchParams.get('email') || undefined;
        const name = searchParams.get('name') || undefined;
        
        if (!phone && !email && !name) {
            return NextResponse.json({ error: 'At least one search parameter (phone, email, or name) is required.' }, { status: 400 });
        }

        const role = user.role || 'cliente';
        const ownerId = role === 'admin' ? null : user.uid;
        
        const results = await searchLeads(ownerId, role, { phone, email, name });
        
        return NextResponse.json(results.data);

    } catch (error: any) {
        console.error('Error in search leads API route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
