import { NextResponse } from 'next/server';
import { updateLeaderProfile } from '@/services/leader/updateLeaderProfile';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function PUT(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profileData = await req.json();
    await updateLeaderProfile(user.uid, profileData);
    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
