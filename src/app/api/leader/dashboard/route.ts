import { NextResponse } from "next/server";

import { getLeaderByUid } from "@/services/leader/getLeaderByUid";
import { getMembersByLeaderPaginated } from "@/services/leader/getMembersByLeaderPaginated";
import { isAuthenticated } from '@/lib/auth/server-side';

export async function GET(req: Request) {
  const user = await isAuthenticated();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json(
      { error: "Parâmetro uid é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const [leader, paginatedMembers] = await Promise.all([
      getLeaderByUid(uid),
      getMembersByLeaderPaginated(uid, 100),
    ]);

    if (!leader) {
      return NextResponse.json(
        { error: "Líder não encontrado." },
        { status: 404 }
      );
    }

    const normalizedMissions: any[] = [];

    const members = paginatedMembers?.members ?? [];
    const totalVotePotential = members.reduce((sum, m) => sum + (Number((m as any).votePotential) || 0), 0);

    return NextResponse.json({
      leader,
      missions: normalizedMissions,
      members,
      totalVotePotential,
    });
  } catch (error) {
    console.error("[api/leader/dashboard] Erro ao carregar dados:", error);
    return NextResponse.json(
      { error: "Falha ao carregar dados do líder." },
      { status: 500 }
    );
  }
}
