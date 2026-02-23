'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'polimetrics_state';

/**
 * Returns the state selected at login time, read from a cookie.
 * Falls back to undefined if not set.
 */
export async function getSelectedState(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}
