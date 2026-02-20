'use server';

import { firestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

interface CreateMemberData {
  name: string;
  leaderId: string;
  phone?: string;
  address?: string;
  cityId?: string;
  birthdate?: string;
  experience?: string;
  votePotential?: number;
  notes?: string;
}

export async function createMember(data: CreateMemberData): Promise<{ success: boolean; message: string }> {
  const { name, leaderId, phone, address, cityId, birthdate, experience, votePotential, notes } = data;

  if (!name || !leaderId) {
    return { success: false, message: 'Nome e ID do líder são obrigatórios.' };
  }

  try {
    const newMemberRef = firestore.collection('members').doc();
    
    await newMemberRef.set({
      name,
      leaderId,
      phone: phone || null,
      bairro: address || '',
      cityId: cityId || null,
      birthdate: birthdate || '',
      experience: experience || '',
      votePotential: Number(votePotential) || 0,
      notes: notes || '',
      status: 'ativo',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Invalida o cache da página de membros para que a lista seja atualizada
    revalidatePath('/dashboard/admin/members');

    return { success: true, message: 'Membro criado com sucesso.' };

  } catch (error: any) {
    console.error("Erro ao criar novo membro:", error);
    return { success: false, message: error.message || 'Falha ao criar o membro.' };
  }
}
