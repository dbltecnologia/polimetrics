
import { NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin';
import { resolveUserRole } from '@/lib/user-role';

// Function to handle POST requests for user login.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;
    const selectedState = body.state as string | undefined;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token not provided.' }, { status: 400 });
    }

    // 1. Verify the ID token using the Firebase Admin SDK.
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Check if the user's status is pending_verification
    const userDoc = await firestore.collection('users').doc(uid).get();
    const userStatus = userDoc.exists ? userDoc.data()?.status : undefined;

    if (userStatus === 'pending_verification') {
      return NextResponse.json(
        { error: 'Sua conta está aguardando aprovação do administrador. Tente novamente em breve.' },
        { status: 403 }
      );
    }

    const { role, name, leader } = await resolveUserRole({
      uid,
      customClaims: decodedToken.claims,
      fallbackName: decodedToken.name || '',
    });

    // 3. Create a session cookie.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // 4. Set the session cookie in the response headers.
    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as "lax" | "none" | "strict",
      path: '/',
    };

    const response = NextResponse.json({ status: 'success', role, name, leader }, { status: 200 });
    response.cookies.set(options);

    // 5. Set the selected state cookie for server-side filtering
    if (selectedState) {
      response.cookies.set({
        name: 'polimetrics_state',
        value: selectedState,
        maxAge: expiresIn / 1000,
        httpOnly: false,
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
