import { NextResponse } from 'next/server';
import { getAllCities } from '@/services/cityService';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET() {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cities = await getAllCities();
    return NextResponse.json(cities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}
