import { firestore } from '@/lib/firebase-admin';
import { MessagingHub } from '../messaging/messaging-hub';

export class VirtualSecretaryEvents {
    /**
     * Dispara uma pesquisa específica para um usuário
     */
    static async triggerPollForUser(userId: string, pollId: string) {
        try {
            const userDoc = await firestore.collection('users').doc(userId).get();
            const pollDoc = await firestore.collection('polls').doc(pollId).get();

            if (!userDoc.exists || !pollDoc.exists) return;

            const user = userDoc.data();
            const poll = pollDoc.data();
            const phone = user?.phone;

            if (!phone || poll?.status !== 'active') return;

            // Montar as opcoes numeradas da pesquisa
            let optionsText = '';
            (poll.options as any[]).forEach((opt, index) => {
                optionsText += `${index + 1}\u{FE0F}\u{20E3} ${opt.text}\n`;
            });

            const message = `🗳️ *PESQUISA IMPORTANTE*\n\nOlá ${user?.name}, sua opinião é fundamental para o nosso projeto!\n\n*${poll.title}*\n${poll.description}\n\n${optionsText}\nResponda apenas com o *NÚMERO* da sua escolha.`;

            const sendResult = await MessagingHub.sendText({
                phone,
                message,
                provider: 'chatwoot',
                contactName: user?.name
            });

            const conversationId = sendResult.conversationId;
            if (!conversationId) return;

            // Atualizar estado da conversa para "esperando_voto"
            await firestore.collection('ai_conversations').doc(conversationId.toString()).set({
                step: 'waiting_poll_vote',
                activePollId: pollId
            }, { merge: true });

        } catch (error) {
            console.error('[TRIGGER_POLL_ERROR]:', error);
        }
    }

    /**
     * Notifica o usuário sobre a mudança de status de uma demanda
     */
    static async onDemandStatusChanged(demandId: string, newStatus: string) {
        try {
            const doc = await firestore.collection('chamados').doc(demandId).get();
            if (!doc.exists) return;

            const demand = doc.data();
            const userId = demand?.userId;

            if (!userId) return;

            const userDoc = await firestore.collection('users').doc(userId).get();
            const user = userDoc.data();
            const phone = user?.phone;

            if (!phone) return;

            // 1. Localizar ou criar conversa no Chatwoot
            // Z-API handles it directly, no need for conversation logic
            
            // 2. Enviar mensagem de atualização
            const statusMap: Record<string, string> = {
                'aberto': 'Aberto (Em Análise)',
                'em_andamento': 'Em Andamento',
                'atendido': 'Atendido/Concluído',
                'cancelado': 'Cancelado'
            };

            const statusText = statusMap[newStatus] || newStatus;
            // FIX #2: chamados do formulário usam `message`, via IA usam `descricao`, fallback para `subject`.
            const descricao: string = demand?.message || demand?.descricao || demand?.subject || 'demanda registrada';
            const message = `Olá ${user?.name}! Tenho novidades sobre sua demanda registrada: "${descricao.slice(0, 60)}...".\n\nO status foi atualizado para: *${statusText}*.\n\nContinuaremos acompanhando!`;

            await MessagingHub.sendText({
                phone,
                message,
                provider: 'zapi',
                zapiInstance: 'reports'
            });

        } catch (error) {
            console.error('[EVENT_HANDLER_ERROR]:', error);
        }
    }

    /**
     * Boas-vindas automática (usado quando um admin cria um usuário manualmente)
     */
    static async onUserCreated(userId: string) {
        try {
            const userDoc = await firestore.collection('users').doc(userId).get();
            const user = userDoc.data();
            const phone = user?.phone;

            if (!phone) return;

            const message = `Olá ${user?.name}! Sou o Secretário Virtual do projeto político. É um prazer ter você conosco!\n\nAqui pelo WhatsApp você poderá:\n✅ Registrar demandas do seu bairro\n✅ Receber notícias e convites\n✅ Participar de pesquisas de opinião\n\nComo posso te ajudar agora?`;

            await MessagingHub.sendText({
                phone,
                message,
                provider: 'zapi',
                zapiInstance: 'campaigns'
            });
        } catch (error) {
            console.error('[USER_CREATED_EVENT_ERROR]:', error);
        }
    }
}
