// src/lib/auth-utils.ts
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
    uid: string;
    role?: 'admin' | 'cliente';
    name?: string | null;
    email?: string | null;
}

const HARDCODED_API_KEY = "123Shaman4";

/**
 * Validates a hardcoded API key provided in the request headers.
 * @param request - The NextRequest object.
 * @returns An object containing a mock authenticated user object, or an error and status.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{ 
    user?: AuthenticatedUser; 
    error?: string;
    status?: number;
}> {
    const providedToken = request.headers.get('X-API-Key');

    if (!providedToken) {
        return { error: 'Unauthorized: Missing API Key.', status: 401 };
    }

    if (providedToken === HARDCODED_API_KEY) {
        // If the key matches, return a mock user object with admin privileges.
        const mockAdminUser: AuthenticatedUser = {
            uid: 'hardcoded-admin-uid',
            email: 'admin@system.local',
            name: 'Hardcoded Admin',
            role: 'admin',
        };
        return { user: mockAdminUser };
    } else {
        return { error: 'Unauthorized: Invalid API Key.', status: 401 };
    }
}
