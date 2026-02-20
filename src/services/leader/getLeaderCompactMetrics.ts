'use server';

import { firestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface LeaderCompactMetrics {
  supportersTotal: number;
  meetingsToday: number;
  activitiesToday: number;
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

export async function getLeaderCompactMetrics(leaderId: string): Promise<LeaderCompactMetrics> {
  const start = Timestamp.fromDate(startOfToday());
  const end = Timestamp.fromDate(endOfToday());
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoTs = Timestamp.fromDate(oneWeekAgo);

  const membersRef = firestore.collection('community-members');
  const activitiesRef = firestore.collection('activities');
  const meetingsRef = firestore.collection('meetings');

  const [membersCountSnap, activitiesTodaySnap, meetingsTodaySnap] = await Promise.all([
    membersRef.where('leaderId', '==', leaderId).count().get().catch(() => null),
    activitiesRef
      .where('leaderId', '==', leaderId)
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get()
      .catch(() => null),
    meetingsRef
      .where('dateTime', '>=', start)
      .where('dateTime', '<=', end)
      .get()
      .catch(() => null)
  ]);

  const supportersTotal = membersCountSnap?.data()?.count ?? 0;
  const activitiesToday = activitiesTodaySnap?.size ?? 0;
  const meetingsToday = meetingsTodaySnap?.size ?? 0;

  return { supportersTotal, meetingsToday, activitiesToday };
}

