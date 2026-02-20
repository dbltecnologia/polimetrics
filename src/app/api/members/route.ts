
import { NextResponse } from 'next/server';
import { createMember } from '@/services/member/createMember';
import { getAllMembers } from '@/services/member/getAllMembers';
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET() {
  const userAuth = await isAuthenticated();
  if (!userAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await getAllMembers();
    return NextResponse.json(members);
  } catch (err: any) {
    console.error("[SERVICE ERROR]", {
      file: "api/members/route.ts",
      function: "GET",
      error: err.message,
    });
    return NextResponse.json({ error: 'Falha ao buscar membros.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, whatsapp, birthdate, experience, votePotential, cityId, leaderId, email, instagram, facebook, cep, address, bairro } = body;

    if (!name || !leaderId || !cityId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const result = await createMember({
      name,
      email,
      whatsapp,
      birthdate,
      experience: experience || '',
      votePotential: Number(votePotential) || 0,
      cityId,
      cep: cep || '',
      address: address || '',
      bairro: bairro || '',
      leaderId,
      instagram: instagram || '',
      facebook: facebook || '',
    });

    return NextResponse.json({ id: result.id });
  } catch (err: any) {
    console.error("[SERVICE ERROR]", {
      file: "api/members/route.ts",
      function: "POST",
      error: err.message,
    });
    return NextResponse.json({ error: 'Falha ao criar membro.' }, { status: 500 });
  }
}
