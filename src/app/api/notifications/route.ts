import { NextResponse } from 'next/server';
import { getAllNotifications } from '@/services/notificationService';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await getAllNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
