import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { firestore } from '@/lib/firebase-admin';
import { geocodeAddress } from '@/lib/geocode';

/** Resolve o nome da cidade a partir do cityId no Firestore */
async function resolveCityName(cityId?: string): Promise<string | undefined> {
    if (!cityId) return undefined;
    try {
        const snap = await firestore.collection('cities').doc(cityId).get();
        if (!snap.exists) return undefined;
        const data = snap.data();
        return data?.name ? `${data.name}` : undefined;
    } catch {
        return undefined;
    }
}

export const dynamic = 'force-dynamic';

const LEADER_ROLES = ['leader', 'lider', 'master', 'sub', 'admin'];

// PATCH — Update a member
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await isAuthenticated();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = await resolveUserRole({
            uid: user.uid,
            customClaims: user.customClaims as Record<string, any> | undefined,
            fallbackName: user.displayName || '',
        });

        const isAdmin = role === 'admin';
        const isLeader = LEADER_ROLES.includes(role) && !isAdmin;

        if (!isAdmin && !isLeader) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const memberId = resolvedParams.id;
        if (!memberId) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        const body = await request.json();

        // Auto-geocode quando bairro/endereço é atualizado e lat/lng não foi fornecido via autocomplete
        let geoUpdate: { lat?: number; lng?: number } = {};
        const addressStr = body.bairro || body.address || body.neighborhood || body.street;
        const hasExplicitCoords = body.lat !== undefined && body.lat !== null;
        if (addressStr && !hasExplicitCoords) {
            const cityName = await resolveCityName(body.cityId);
            const query = cityName
                ? `${addressStr}, ${cityName}, Brasil`
                : `${addressStr}, Brasil`;
            const coords = await geocodeAddress(query, cityName);
            if (coords) geoUpdate = coords;
        } else if (hasExplicitCoords) {
            geoUpdate = { lat: body.lat, lng: body.lng };
        }

        const memberRef = firestore.collection('members').doc(memberId);
        const memberDoc = await memberRef.get();

        if (!memberDoc.exists) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Leaders can only edit members that belong to them
        if (isLeader && memberDoc.data()?.leaderId !== user.uid) {
            return NextResponse.json({ error: 'Forbidden: member does not belong to you' }, { status: 403 });
        }

        await memberRef.update({
            ...body,
            ...geoUpdate,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Membro atualizado com sucesso.' });

    } catch (error) {
        console.error('Erro ao atualizar membro:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE — Remove a member
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await isAuthenticated();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { role } = await resolveUserRole({
            uid: user.uid,
            customClaims: user.customClaims as Record<string, any> | undefined,
            fallbackName: user.displayName || '',
        });

        const isAdminDel = role === 'admin';
        const isLeaderDel = LEADER_ROLES.includes(role) && !isAdminDel;

        if (!isAdminDel && !isLeaderDel) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const resolvedParams = await params;
        const memberId = resolvedParams.id;
        if (!memberId) {
            return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
        }

        // Leaders can only delete their own members
        if (isLeaderDel) {
            const memberDoc = await firestore.collection('members').doc(memberId).get();
            if (!memberDoc.exists || memberDoc.data()?.leaderId !== user.uid) {
                return NextResponse.json({ error: 'Forbidden: member does not belong to you' }, { status: 403 });
            }
        }

        await firestore.collection('members').doc(memberId).delete();

        return NextResponse.json({ success: true, message: 'Membro excluído com sucesso.' });

    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
