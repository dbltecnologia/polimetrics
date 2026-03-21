'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { geocodeAddress } from '@/lib/geocode';

// Basic validation, can be improved with Zod
const validateInput = (name: string, email: string, phone: string) => {
    if (!name || !email || !phone) {
        throw new Error('Nome, e-mail e telefone são obrigatórios.');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Formato de e-mail inválido.');
    }
}

export async function addLeader(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string) || 'sub';
    const status = (formData.get('status') as string) || 'ativo';
    const cityId = (formData.get('cityId') as string) || null;
    const parentLeaderId = (formData.get('parentLeaderId') as string) || null;
    const experience = (formData.get('experience') as string) || '';
    const birthdate = (formData.get('birthdate') as string) || '';
    const notes = (formData.get('notes') as string) || '';
    const cpf = (formData.get('cpf') as string) || '';
    const bairro = (formData.get('bairro') as string) || '';
    const areaAtuacao = (formData.get('areaAtuacao') as string) || '';
    const influencia = (formData.get('influencia') as string) || null;
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;
    let lat = latStr ? parseFloat(latStr) : null;
    let lng = lngStr ? parseFloat(lngStr) : null;

    // Se lat/lng não foi resolvido via autocomplete, geocodifica pelo bairro + cidade
    if (!lat && bairro) {
        try {
            let cityName: string | undefined;
            if (cityId) {
                const citySnap = await firestore.collection('cities').doc(cityId).get();
                if (citySnap.exists) cityName = citySnap.data()?.name;
            }
            const query = cityName ? `${bairro}, ${cityName}, Brasil` : `${bairro}, Brasil`;
            const coords = await geocodeAddress(query, cityName);
            if (coords) { lat = coords.lat; lng = coords.lng; }
        } catch (geoErr) {
            console.warn('[createLeader] Geocoding falhou (não bloqueia o cadastro):', geoErr);
        }
    }

    try {
        validateInput(name, email, phone);
        if (!password || password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }

        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true, // Assuming admin-created users are auto-verified
        });

        // 2. Create user document in Firestore
        await firestore.collection('users').doc(userRecord.uid).set({
            name,
            email,
            phone,
            role,
            status,
            cityId,
            parentLeaderId,
            experience,
            birthdate,
            notes,
            cpf,
            bairro,
            areaAtuacao,
            influencia,
            lat,
            lng,
            createdAt: new Date(),
        });

        // 3. Dispara boas-vindas via WhatsApp (fire-and-forget — não bloqueia a resposta)
        // Gap #5 fix: onUserCreated estava implementado no event-handler mas nunca era chamado.
        try {
            const { VirtualSecretaryEvents } = await import('@/services/ai/event-handler');
            VirtualSecretaryEvents.onUserCreated(userRecord.uid).catch(err =>
                console.warn('[createLeader] onUserCreated silencioso:', err)
            );
        } catch {
            // import dinâmico falhou (sem env Chatwoot) — ignorar silenciosamente
        }

        // 4. Revalidate the leaders page to show the new leader
        revalidatePath('/dashboard/admin/leaders');

        return { success: true, message: 'Líder criado com sucesso!' };

    } catch (error: any) {
        console.error("Error creating leader:", error);
        return { success: false, message: error.message || 'Falha ao criar líder.' };
    }
}
