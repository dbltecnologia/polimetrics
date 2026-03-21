import { firestore } from '@/lib/firebase-admin';
import { ChatwootService } from '../chatwootService';

export class EngagementService {
    /**
     * Varredura diária/periódica para identificar queda de engajamento
     * (Simulando o que um CRON JOB faria)
     */
    static async checkInactivityAndAlertAdmin() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // 1. Buscar líderes com influência alta que não interagem há 30 dias
        const inactiveHighInfluenceLeaders = await firestore.collection('users')
            .where('influencia', '==', 'Alta')
            .where('lastInteractedAt', '<', thirtyDaysAgo.toISOString())
            .get();

        if (inactiveHighInfluenceLeaders.empty) return;

        // 2. Notificar o Admin (via o primeiro admin encontrado ou configurado)
        const admins = await firestore.collection('users')
            .where('role', 'in', ['admin', 'master'])
            .limit(1)
            .get();

        if (admins.empty) return;
        const admin = admins.docs[0].data();
        const adminPhone = admin.phone;

        if (!adminPhone) return;

        const contactId = await ChatwootService.findOrCreateContact(adminPhone, admin.name);
        const conversationId = await ChatwootService.findOrCreateConversation(contactId, adminPhone);

        let alertMessage = `⚠️ *Alerta de Engajamento:*\nIdentifiquei ${inactiveHighInfluenceLeaders.size} líderes de *influência alta* inativos há mais de 30 dias:\n\n`;

        inactiveHighInfluenceLeaders.forEach(doc => {
            const data = doc.data();
            alertMessage += `• ${data.name} (${data.bairro})\n`;
        });

        alertMessage += `\nSugestão: Deseja que eu envie uma mensagem motivacional automática para eles?`;

        await ChatwootService.sendMessage(conversationId, alertMessage);
    }

    /**
     * Envia um "nudge" (cutucada) proativa para usuários inativos
     */
    static async nudgeInactiveUser(userId: string) {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const user = userDoc.data();
        const phone = user?.phone;

        if (!phone) return;

        const contactId = await ChatwootService.findOrCreateContact(phone, user?.name);
        const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

        const message = `Olá ${user?.name}! Faz um tempo que não conversamos. Como estão as coisas no bairro ${user?.bairro || 'seu bairro'}? Alguma nova demanda que gostaria de registrar? Estamos aqui para ouvir!`;

        await ChatwootService.sendMessage(conversationId, message);
        
        // Marcar que enviamos o nudge
        await firestore.collection('users').doc(userId).update({
            lastNudgeAt: new Date().toISOString()
        });
    }
}
