import { firestore } from '@/lib/firebase-admin';
import { MessagingHub } from '../messaging/messaging-hub';

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

        const alertMessage = `⚠️ *Alerta de Engajamento*\nExistem ${inactiveHighInfluenceLeaders.size} líderes de Alta Influência sem interação há mais de 30 dias. Acesse o painel para verificar.`;

        await MessagingHub.sendText({
            phone: adminPhone,
            message: alertMessage,
            provider: 'zapi',
            zapiInstance: 'reports'
        });
    }

    /**
     * Envia um "nudge" (cutucada) proativa para usuários inativos
     */
    static async nudgeInactiveUser(userId: string) {
        const userDoc = await firestore.collection('users').doc(userId).get();
        const user = userDoc.data();
        const phone = user?.phone;

        if (!phone) return;

        const userName = user?.name || 'Cidadão';
        const message = `Olá, ${userName}! Sentimos sua falta no projeto. Como estão as demandas no seu bairro? Mande uma mensagem caso precise de algo!`;

        await MessagingHub.sendText({
            phone,
            message,
            provider: 'zapi',
            zapiInstance: 'campaigns'
        });
        
        // Marcar que enviamos o nudge
        await firestore.collection('users').doc(userId).update({
            lastNudgeAt: new Date().toISOString()
        });
    }
}
