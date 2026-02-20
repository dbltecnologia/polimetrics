export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/server-side';
import { resolveUserRole } from '@/lib/user-role';
import { saveContent } from '@/services/admin/contentService';

export async function POST(request: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });

  if (role !== 'admin' && role !== 'leader') {
    return NextResponse.json({ error: 'Você não tem permissão para publicar conteúdo.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, content, status = 'draft', featuredImageUrl, audioBase64 } = body || {};

    if (!title || !content) {
      return NextResponse.json({ error: 'Título e conteúdo são obrigatórios.' }, { status: 400 });
    }

    const { contentId, error } = await saveContent(
      {
        title,
        content,
        type: 'article',
        status,
        featuredImageUrl,
        audioBase64,
      },
      user.uid
    );

    if (error || !contentId) {
      return NextResponse.json({ error: error || 'Falha ao salvar conteúdo.' }, { status: 500 });
    }

    return NextResponse.json({ id: contentId }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/content] erro:', err);
    return NextResponse.json({ error: 'Falha ao salvar conteúdo.' }, { status: 500 });
  }
}

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = await resolveUserRole({
    uid: user.uid,
    customClaims: user.customClaims as Record<string, any> | undefined,
    fallbackName: user.displayName || user.email || '',
  });

  if (role !== 'admin' && role !== 'leader') {
    return NextResponse.json({ error: 'Você não tem permissão para ver conteúdo.' }, { status: 403 });
  }

  try {
    const { getContentList } = await import('@/services/admin/contentService');
    const list = await getContentList();
    return NextResponse.json({ items: list });
  } catch (err) {
    console.error('[GET /api/content] erro:', err);
    return NextResponse.json({ error: 'Falha ao buscar conteúdo.' }, { status: 500 });
  }
}
