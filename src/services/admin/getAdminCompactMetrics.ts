'use server';

import { firestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AdminCompactMetrics {
  meetingsToday: number;
  openChamados: number;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getAdminCompactMetrics(): Promise<AdminCompactMetrics> {
  const start = Timestamp.fromDate(startOfToday());
  const end = Timestamp.fromDate(endOfToday());

  const meetingsRef = firestore.collection('meetings');
  const chamadosRef = firestore.collection('chamados');

  const [meetingsSnap, chamadosOpenSnap] = await Promise.all([
    meetingsRef
      .where('dateTime', '>=', start)
      .where('dateTime', '<=', end)
      .get()
      .catch(() => null),
    chamadosRef.where('status', '==', 'aberto').get().catch(() => null),
  ]);

  const meetingsToday = meetingsSnap?.size ?? 0;
  const openChamados = chamadosOpenSnap?.size ?? 0;

  return {
    meetingsToday,
    openChamados,
  };
}

