
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { Member } from './getAllMembers';

interface HistoryItem {
    type: 'Anotação' | 'Missão' | 'Visita';
    title: string;
    date: string;
    description: string;
}

interface MemberKPIs {
    totalPoints: number;
    lastMission: string | null;
    lastAction: string | null;
    currentStatus: 'ativo' | 'inativo' | 'potencial';
}

export interface MemberDetails extends Member {
    history: HistoryItem[];
    kpis: MemberKPIs;
}

export async function getMemberDetails(memberId: string): Promise<MemberDetails | null> {
    try {
        const memberDoc = await firestore.collection('members').doc(memberId).get();

        if (!memberDoc.exists) {
            return null;
        }

        const memberData = memberDoc.data()!;

        const [leaderDoc, notesSnapshot, missionsSnapshot, actionsSnapshot] = await Promise.all([
            memberData.leaderId ? firestore.collection('users').doc(memberData.leaderId).get() : Promise.resolve(null),
            // orderBy removed — sort in-memory below to avoid requiring Firestore composite indexes
            firestore.collection('notes').where('memberId', '==', memberId).get(),
            firestore.collection('mission_logs').where('memberId', '==', memberId).get(),
            firestore.collection('community_actions').where('memberId', '==', memberId).get(),
        ]);

        const toDate = (v: any): Date => {
            if (!v) return new Date(0);
            if (typeof v.toDate === 'function') return v.toDate();
            return new Date(v);
        };

        const history: HistoryItem[] = [];
        notesSnapshot.forEach(doc => history.push({ type: 'Anotação', title: 'Anotação adicionada', date: toDate(doc.data().createdAt).toISOString(), description: doc.data().content || '' }));
        missionsSnapshot.forEach(doc => history.push({ type: 'Missão', title: `Missão: ${doc.data().missionName || 'Missão Concluída'}`, date: toDate(doc.data().completedAt).toISOString(), description: `+${doc.data().points || 25} pontos` }));
        // As visitas ainda não estão modeladas, então serão adicionadas futuramente

        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalPoints = missionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 25), 0);

        const kpis: MemberKPIs = {
            totalPoints: totalPoints,
            lastMission: missionsSnapshot.docs.length > 0 ? toDate(missionsSnapshot.docs.sort((a, b) => toDate(b.data().completedAt).getTime() - toDate(a.data().completedAt).getTime())[0].data().completedAt).toLocaleDateString('pt-BR') : 'Nenhuma',
            lastAction: actionsSnapshot.docs.length > 0 ? toDate(actionsSnapshot.docs.sort((a, b) => toDate(b.data().createdAt).getTime() - toDate(a.data().createdAt).getTime())[0].data().createdAt).toLocaleDateString('pt-BR') : 'Nenhuma',
            currentStatus: memberData.status || 'potencial',
        };

        const address = [memberData.street, memberData.city, memberData.state].filter(Boolean).join(', ');

        return {
            id: memberDoc.id,
            name: memberData.name,
            phone: memberData.phone || null,
            address: address || 'Endereço não informado',
            leaderId: memberData.leaderId || null,
            leaderName: leaderDoc && leaderDoc.exists ? leaderDoc.data()!.name : 'Sem líder',
            status: memberData.status || 'potencial',
            history: history,
            kpis: kpis,
        };

    } catch (error) {
        console.error(`Error fetching details for member ${memberId}:`, error);
        return null;
    }
}
