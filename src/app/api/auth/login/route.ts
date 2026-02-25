
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { resolveUserRole } from '@/lib/user-role';

// Function to handle POST requests for user login.
export async function POST(request: Request) {
  try {
    // 1. Extract the ID token and selected state from the request body.
    const body = await request.json();
    const idToken = body.idToken;
    const selectedState = body.state as string | undefined;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token not provided.' }, { status: 400 });
    }

    // 2. Verify the ID token using the Firebase Admin SDK.
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { role, name, leader } = await resolveUserRole({
      uid,
      customClaims: decodedToken.claims,
      fallbackName: decodedToken.name || '',
    });

    // 4. Create a session cookie.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // 5. Set the session cookie in the response headers.
    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // Next.js cookies expect maxAge in seconds
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as "lax" | "none" | "strict",
      path: '/',
    };

    const response = NextResponse.json({ status: 'success', role, name, leader }, { status: 200 });
    response.cookies.set(options);

    // 6. Set the selected state cookie for server-side filtering
    if (selectedState) {
      response.cookies.set({
        name: 'polimetrics_state',
        value: selectedState,
        maxAge: expiresIn / 1000, // Next.js cookies expect maxAge in seconds
        httpOnly: false, // readable by client too for display purposes
        secure: isProduction,
        sameSite: (isProduction ? 'none' : 'lax') as "lax" | "none" | "strict",
        path: '/',
      });
    }

    return response;

  } catch (error) {
    console.error('Login API route error:', error);
    const code = (error as any)?.code;
    if (code === 'auth/invalid-id-token' || code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token inválido ou expirado. Faça login novamente.' }, { status: 401 });
    }
    if (code === 'auth/user-disabled') {
      return NextResponse.json({ error: 'Usuário desativado. Contate o suporte.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Falha ao autenticar. Verifique suas credenciais e tente novamente.' }, { status: 401 });
  }
}
