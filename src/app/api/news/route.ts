import { NextResponse } from 'next/server';
import { getAllNews } from '@/services/newsService';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const news = await getAllNews();
    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
