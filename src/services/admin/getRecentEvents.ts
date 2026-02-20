'use server';

import { firestore } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export interface RecentEvent {
  id: string;
  title: string;
  dateTime: string; // ISO string
  leaderName: string;
  participantsCount: number;
}

function coerceToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Função auxiliar para buscar o nome do líder
async function getLeaderName(leaderId: string): Promise<string> {
  if (!leaderId) return 'Desconhecido';
  try {
    const [userDoc, leaderDoc] = await Promise.all([
      firestore.collection('users').doc(leaderId).get(),
      firestore.collection('leaders').doc(leaderId).get(),
    ]);
    const data = (userDoc.exists ? userDoc.data() : leaderDoc.exists ? leaderDoc.data() : null) as any;
    return data?.name || 'Desconhecido';
  } catch (error) {
    console.error(`Error fetching leader name for ID: ${leaderId}`, error);
    return 'Desconhecido';
  }
}

export async function getRecentEvents(): Promise<RecentEvent[]> {
  try {
    const now = new Date();
    const eventsRef = firestore.collection('events');

    const [dateTimeSnapshot, dateSnapshot] = await Promise.all([
      eventsRef.where('dateTime', '>=', now).orderBy('dateTime', 'asc').limit(5).get().catch(() => null),
      eventsRef.where('date', '>=', now).orderBy('date', 'asc').limit(5).get().catch(() => null),
    ]);

    const eventsSnapshot = (dateTimeSnapshot && !dateTimeSnapshot.empty)
      ? dateTimeSnapshot
      : (dateSnapshot && !dateSnapshot.empty)
        ? dateSnapshot
        : null;

    if (!eventsSnapshot || eventsSnapshot.empty) {
      return [];
    }

    const recentEvents = await Promise.all(
      eventsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const leaderName = await getLeaderName(data.leaderId);
        const dateValue = data.dateTime ?? data.date ?? data.createdAt;
        const date = coerceToDate(dateValue);
        
        return {
          id: doc.id,
          title: data.title || 'Evento sem título',
          dateTime: (date || new Date(0)).toISOString(),
          leaderName: leaderName,
          participantsCount:
            data.participantsCount ||
            (Array.isArray(data.attendees) ? data.attendees.length : 0) ||
            0,
        };
      })
    );

    return recentEvents.filter((event) => event.dateTime !== new Date(0).toISOString());
  } catch (error) {
    console.error("Error fetching recent events:", error);
    return [];
  }
}
