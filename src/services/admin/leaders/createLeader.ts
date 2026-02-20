'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

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
    const experience = (formData.get('experience') as string) || '';
    const birthdate = (formData.get('birthdate') as string) || '';
    const notes = (formData.get('notes') as string) || '';
    const cpf = (formData.get('cpf') as string) || '';
    const bairro = (formData.get('bairro') as string) || '';
    const areaAtuacao = (formData.get('areaAtuacao') as string) || '';
    const influencia = (formData.get('influencia') as string) || null;
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

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

        // 3. Revalidate the leaders page to show the new leader
        revalidatePath('/dashboard/admin/leaders');

        return { success: true, message: 'Líder criado com sucesso!' };

    } catch (error: any) {
        console.error("Error creating leader:", error);
        return { success: false, message: error.message || 'Falha ao criar líder.' };
    }
}
