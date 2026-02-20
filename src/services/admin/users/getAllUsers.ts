'use server';

import { auth } from '@/lib/firebase-admin';
import { safeSerialize } from '@/lib/utils';

export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    disabled: boolean;
    creationTime: string; // Storing as ISO string for serialization
    lastSignInTime: string; // Storing as ISO string for serialization
}

export async function getAllUsers(): Promise<User[]> {
    try {
        const listUsersResult = await auth.listUsers();
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email || '',
            displayName: userRecord.displayName || 'Usuário sem nome',
            role: userRecord.customClaims?.role || 'member',
            disabled: userRecord.disabled,
            // Convert date fields to ISO strings to ensure serialization
            creationTime: new Date(userRecord.metadata.creationTime).toISOString(),
            lastSignInTime: new Date(userRecord.metadata.lastSignInTime).toISOString(),
        }));

        // Use safeSerialize to be absolutely sure the returned object is clean
        return safeSerialize(users);

    } catch (error) {
        console.error("Error listing users:", error);
        // It's better to throw the error to be handled by the calling component
        throw new Error('Failed to fetch users.');
    }
}
