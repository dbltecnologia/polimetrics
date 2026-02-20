'use server';

import { auth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

interface UpdateUserData {
    role?: 'admin' | 'leader' | 'member';
    disabled?: boolean;
}

export async function updateUser(uid: string, data: UpdateUserData): Promise<{ success: boolean; message?: string }> {
    try {
        // Update custom claims for role if provided
        if (data.role) {
            await auth.setCustomUserClaims(uid, { role: data.role });
        }

        // Update user disabled status if provided
        if (data.disabled !== undefined) {
            await auth.updateUser(uid, {
                disabled: data.disabled,
            });
        }

        // Revalidate the path to ensure the UI updates with fresh data
        revalidatePath('/dashboard/admin/users');

        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, message: error.message || 'Falha ao atualizar o usuário.' };
    }
}
