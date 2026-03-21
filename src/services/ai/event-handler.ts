import { firestore } from '@/lib/firebase-admin';
import { ChatwootService } from '../chatwootService';

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

            const contactId = await ChatwootService.findOrCreateContact(phone, user?.name);
            const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

            // Montar as opções
            let optionsText = "";
            poll.options.forEach((opt: any, index: number) => {
                optionsText += `${index + 1}️⃣ ${opt.text}\n`;
            });

            const message = `🗳️ *PESQUISA IMPORTANTE*\n\nOlá ${user?.name}, sua opinião é fundamental para o nosso projeto!\n\n*${poll.title}*\n${poll.description}\n\n${optionsText}\nResponda apenas com o *NÚMERO* da sua escolha.`;

            await ChatwootService.sendMessage(conversationId, message);

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
            const contactId = await ChatwootService.findOrCreateContact(phone, user?.name);
            const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

            // 2. Enviar mensagem de atualização
            const statusMap: Record<string, string> = {
                'aberto': 'Aberto (Em Análise)',
                'em_andamento': 'Em Andamento',
                'atendido': 'Atendido/Concluído',
                'cancelado': 'Cancelado'
            };

            const statusText = statusMap[newStatus] || newStatus;
            const message = `Olá ${user?.name}! Tenho novidades sobre sua demanda registrada: "${demand?.descricao?.slice(0, 50)}...".\n\nO status foi atualizado para: *${statusText}*.\n\nContinuaremos acompanhando!`;

            await ChatwootService.sendMessage(conversationId, message);

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

            const contactId = await ChatwootService.findOrCreateContact(phone, user?.name);
            const conversationId = await ChatwootService.findOrCreateConversation(contactId, phone);

            const message = `Olá ${user?.name}! Sou o Secretário Virtual do projeto político. É um prazer ter você conosco!\n\nAqui pelo WhatsApp você poderá:\n✅ Registrar demandas do seu bairro\n✅ Receber notícias e convites\n✅ Participar de pesquisas de opinião\n\nComo posso te ajudar agora?`;

            await ChatwootService.sendMessage(conversationId, message);
        } catch (error) {
            console.error('[USER_CREATED_EVENT_ERROR]:', error);
        }
    }
}
