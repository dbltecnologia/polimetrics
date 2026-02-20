
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Nunca intercepte rotas de API: elas devem retornar JSON (ex: 401) em vez de HTML por redirect.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rotas públicas que não exigem autenticação
  const publicRoutes = ['/login', '/register', '/reset-password', '/api/auth/login'];

  // Permite acesso a rotas públicas
  if (publicRoutes.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Se não há cookie de sessão e a rota não é pública, redireciona para o login
  if (!sessionCookie) {
    // Evita redirecionamento infinito se a página de login não estiver nas rotas públicas
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Se o cookie de sessão existe, permite que a requisição continue.
  // A validação do token será feita em API Routes ou Server Components protegidos.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclui arquivos estáticos, imagens e a própria página de login da verificação
    '/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.png$).*)',
  ],
};
