"use client";

import api from '@/services/api';
import { Member } from '@/types/member';

export async function getAllMembers(): Promise<Member[]> {
  const response = await api.get('/members');
  return response.data;
}

export async function addMember(memberData: Partial<Member> & { leaderId: string; cityId: string }) {
  const response = await api.post('/members', {
    ...memberData,
  });
  return response.data;
}

export async function countMembersByLeader(uid: string): Promise<number> {
  const response = await api.get(`/leader/member-count?uid=${uid}`);
  return response.data?.count ?? 0;
}
