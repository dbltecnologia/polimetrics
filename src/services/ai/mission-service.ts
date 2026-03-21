import { firestore } from '@/lib/firebase-admin';
import { ChatwootService } from '../chatwootService';
import { AppUser } from '@/types/user';

export class MissionService {
    /**
     * Envia um convite de missão para um líder
     */
    static async triggerMissionForUser(userId: string, missionId: string) {
        try {
            const userDoc = await firestore.collection('users').doc(userId).get();
            const missionDoc = await firestore.collection('missions').doc(missionId).get();

            if (!userDoc.exists || !missionDoc.exists) return;

            const user = userDoc.data();
            const mission = missionDoc.data();
            const phone = user?.phone;

            if (!phone) return;

            const contactId = await ChatwootService.findOrCreateContact(phone, user?.name);
            const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

            const message = `🚀 *NOVA MISSÃO DISPONÍVEL*\n\nOlá ${user?.name}, temos um desafio para você fortalecer nossa base em ${user?.bairro}!\n\n*Missão:* ${mission.title}\n*O que fazer:* ${mission.description}\n*Recompensa:* 🏆 ${mission.rewardPoints} pontos\n\nVocê aceita este desafio? Responda *SIM* para começar!`;

            await ChatwootService.sendMessage(conversationId, message);

            // Registrar estado da missão na conversa
            await firestore.collection('ai_conversations').doc(conversationId.toString()).set({
                step: 'waiting_mission_acceptance',
                activeMissionId: missionId
            }, { merge: true });

        } catch (error) {
            console.error('[MISSION_TRIGGER_ERROR]:', error);
        }
    }

    /**
     * Registra a conclusão de uma missão e atribui pontos
     */
    static async completeMission(userId: string, missionId: string, proof?: string) {
        const missionDoc = await firestore.collection('missions').doc(missionId).get();
        if (!missionDoc.exists) return;

        const mission = missionDoc.data();
        const points = mission?.rewardPoints || 0;

        // 1. Criar log de conclusão
        await firestore.collection('mission_logs').add({
            leaderId: userId,
            missionId,
            points,
            proof: proof || 'Concluído via WhatsApp',
            createdAt: new Date()
        });

        // 2. Atualizar pontos do usuário
        await firestore.collection('users').doc(userId).update({
            totalPoints: firestore.FieldValue.increment(points),
            engagementScore: firestore.FieldValue.increment(10) // Bônus de engajamento
        });

        return { success: true, points };
    }
}
