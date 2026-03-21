import { firestore } from '@/lib/firebase-admin';
import { generateText } from './providers';
import { ChatwootService } from '../chatwootService';
import { AppUser } from '@/types/user';

export class ContentAlignmentService {
    /**
     * Gera e envia uma mensagem de alinhamento/motivação semanal para um usuário
     * Baseia-se no bairro, área de atuação e influência.
     */
    static async sendWeeklyAlignment(userId: string, weekTopic?: string) {
        try {
            const userDoc = await firestore.collection('users').doc(userId).get();
            if (!userDoc.exists) return;

            const user = { id: userDoc.id, ...userDoc.data() } as AppUser;
            const phone = user.phone;
            if (!phone) return;

            // 1. Gerar Conteúdo Personalizado via IA
            const prompt = `
                Você é o Secretário Virtual de um projeto político comunitário.
                Objetivo: Enviar uma mensagem de alinhamento e motivação para um apoiador.

                Dados do Apoiador:
                - Nome: ${user.name}
                - Bairro: ${user.bairro || 'Não informado'}
                - Área de Atuação: ${user.areaAtuacao || 'Comunitária'}
                - Grau de Influência: ${user.influencia || 'Membro'}
                
                Tópico da Semana (Contexto): ${weekTopic || 'Fortalecimento da base e escuta ativa nos bairros.'}

                Diretrizes:
                1. Seja motivador, cívico e próximo.
                2. Mencione o bairro e a área de atuação dele de forma natural.
                3. Se a influência for "Alta", trate-o como uma liderança fundamental.
                4. A mensagem deve ter entre 2 e 4 parágrafos curtos.
                5. Use emojis moderadamente.
                6. Termine com uma frase de impacto sobre o futuro da cidade/região.
            `;

            const alignmentMessage = await generateText({ prompt, provider: 'gemini' });

            // 2. Enviar via Chatwoot
            const contactId = await ChatwootService.findOrCreateContact(phone, user.name);
            const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

            await ChatwootService.sendMessage(conversationId, `✨ *MENSAGEM DE ALINHAMENTO*\n\n${alignmentMessage}`);

            // 3. Registrar no log de atividades
            await firestore.collection('activities').add({
                leaderId: userId,
                type: 'CONTENT_ALIGNMENT',
                description: `Recebeu mensagem de alinhamento semanal: ${weekTopic || 'Geral'}`,
                createdAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('[ALIGNMENT_SERVICE_ERROR]:', error);
            return { success: false, error };
        }
    }

    /**
     * Disparo em massa (Batch) para um grupo ou bairro específico
     */
    static async batchSendAlignment(filters: { bairro?: string; role?: string }, weekTopic: string) {
        let query: any = firestore.collection('users');

        if (filters.bairro) query = query.where('bairro', '==', filters.bairro);
        if (filters.role) query = query.where('role', '==', filters.role);

        const snapshot = await query.get();
        const results = [];

        for (const doc of snapshot.docs) {
            results.push(this.sendWeeklyAlignment(doc.id, weekTopic));
        }

        return Promise.all(results);
    }
}
