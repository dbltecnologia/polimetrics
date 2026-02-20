'use server';

import { cookies } from 'next/headers';

export async function logout() {
    // This simply deletes the session cookie. The client-side will then be unauthenticated.
    (await cookies()).delete('session');
}
