import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateText } from './providers';
import { ChatwootService } from '../chatwootService';
import { AppUser } from '@/types/user';
import { KnowledgeBaseService } from './knowledge-base-service';
import { MissionService } from './mission-service';

export class VirtualSecretary {
    /**
     * Processa uma mensagem recebida do Chatwoot
     */
    static async processMessage(payload: any) {
        const { content, conversation, sender } = payload;
        const conversationId = conversation.id;
        const phone = sender.phone_number.replace(/\D/g, '');
        const name = sender.name;

        // IMPROVEMENT #14: Rate limiting — max 10 msgs / phone / 60s (anti-bot, anti-loop)
        const isRateLimited = await this.checkRateLimit(phone);
        if (isRateLimited) {
            console.warn(`[VirtualSecretary] Rate limit atingido para o número ${phone}. Mensagem ignorada.`);
            return;
        }

        // 1. Identificar usuário no Firestore
        let user = await this.findUserByPhone(phone);

        // 2. Obter ou criar estado da conversa
        const conversationState = await this.getConversationState(conversationId);

        // 3. Lógica de decisão (Fluxos)
        let response = '';

        // FIX #1: Injetar conversationId no state para que todos os sub-fluxos possam persistir o estado corretamente.
        const state = { ...(conversationState ?? { step: 'start', history: [] }), conversationId };
        if (!user) {
            response = await this.handleNewLead(phone, name, content, state);
        } else if (state.step === 'waiting_poll_vote') {
            response = await this.handlePollVote(user, content, state);
        } else if (state.step === 'waiting_mission_acceptance') {
            response = await this.handleMissionAcceptance(user, content, state);
        } else if (state.step === 'waiting_mission_proof') {
            response = await this.handleMissionProof(user, content, state);
        } else if (user.status === 'lead' || !user.profile?.isProfileComplete) {
            response = await this.handleQualification(user, content, state);
        } else {
            response = await this.handleMainFlow(user, content, state);
        }

        // 4. Enviar resposta via Chatwoot
        if (response) {
            await ChatwootService.sendMessage(conversationId, response);
            
            // 5. Atualizar Engajamento (passa o role para proteger status de líderes)
            if (user?.id) {
                await this.updateEngagement(user.id, user.role);
            }
        }
    }

    /**
     * IMPROVEMENT #14: Rate limiting via Firestore.
     * Conta as mensagens do número nos últimos RATE_WINDOW_MS ms.
     * Retorna true se o limite foi atingido (mensagem deve ser descartada).
     */
    private static readonly RATE_LIMIT_MAX = 10;
    private static readonly RATE_WINDOW_MS = 60_000; // 60 segundos

    private static async checkRateLimit(phone: string): Promise<boolean> {
        try {
            const windowStart = new Date(Date.now() - this.RATE_WINDOW_MS).toISOString();
            const rateLimitRef = firestore.collection('ai_rate_limits').doc(phone);

            return await firestore.runTransaction(async (tx) => {
                const doc = await tx.get(rateLimitRef);
                const data = doc.data() ?? { timestamps: [] };
                // Filtrar apenas timestamps dentro da janela
                const recent: string[] = (data.timestamps as string[]).filter(
                    (ts: string) => ts > windowStart
                );
                if (recent.length >= this.RATE_LIMIT_MAX) {
                    return true; // Limite atingido
                }
                // Adicionar timestamp atual
                recent.push(new Date().toISOString());
                tx.set(rateLimitRef, { timestamps: recent }, { merge: false });
                return false;
            });
        } catch (err) {
            // Em caso de erro no rate limit, permitir a mensagem (fail-open)
            console.warn('[VirtualSecretary] checkRateLimit falhou silenciosamente:', err);
            return false;
        }
    }

    private static async updateEngagement(userId: string, userRole?: string) {
        const userRef = firestore.collection('users').doc(userId);
        // FIX #4: Só atualizar status para usuários comuns — nunca sobrescrever o status de líderes/admins.
        const isCommonUser = !userRole || userRole === 'citizen' || userRole === 'lead';
        await userRef.update({
            lastInteractedAt: new Date().toISOString(),
            engagementScore: FieldValue.increment(1),
            ...(isCommonUser ? { status: 'engajado' } : {}),
        });
    }

    private static async findUserByPhone(phone: string): Promise<AppUser | null> {
        const snapshot = await firestore.collection('users')
            .where('phone', '==', phone)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AppUser;
    }

    private static async getConversationState(conversationId: number): Promise<Record<string, any> & { step: string; history: any[] }> {
        const doc = await firestore.collection('ai_conversations').doc(conversationId.toString()).get();
        if (!doc.exists) {
            return { step: 'start', history: [] };
        }
        return (doc.data() ?? { step: 'start', history: [] }) as Record<string, any> & { step: string; history: any[] };
    }

    private static async updateConversationState(conversationId: number, state: any) {
        await firestore.collection('ai_conversations').doc(conversationId.toString()).set(state, { merge: true });
    }

    /**
     * Processa a resposta numérica de uma pesquisa
     */
    private static async handlePollVote(user: AppUser, content: string, state: any) {
        const pollId = state.activePollId;
        const index = parseInt(content.replace(/\D/g, '')) - 1;

        if (isNaN(index)) {
            return "Por favor, responda apenas com o número da opção desejada para que eu possa registrar seu voto corretamente.";
        }

        const pollDoc = await firestore.collection('polls').doc(pollId).get();
        if (!pollDoc.exists) return "Essa pesquisa não está mais ativa.";

        const poll = pollDoc.data();
        const option = poll?.options[index];

        if (!option) {
            return `A opção ${content} não é válida. Por favor, escolha um número de 1 a ${poll?.options.length}.`;
        }

        // FIX #4: Detectar voto duplicado e avisar o usuário antes de sobrescrever
        const alreadyVotedOptionId: string | undefined = poll?.votedBy?.[user.id];
        const alreadyVotedOption = alreadyVotedOptionId
            ? poll?.options.find((o: any) => o.id === alreadyVotedOptionId)
            : null;

        // Registrar / atualizar o voto no Firestore
        await firestore.collection('polls').doc(pollId).update({
            [`votedBy.${user.id}`]: option.id
        });

        // Voltar ao fluxo principal
        await this.updateConversationState(state.conversationId, { step: 'main', activePollId: null });

        if (alreadyVotedOption) {
            return `Seu voto foi atualizado! Anteriormente você havia escolhido *${alreadyVotedOption.text}* e agora está votando em *${option.text}*. ✅\n\nObrigado por participar!`;
        }
        return `Voto registrado com sucesso: *${option.text}*!\n\nMuito obrigado por participar. Sua voz fortalece nosso projeto. 🚀`;
    }

    /**
     * Fluxo de Aceitação de Missão
     */
    private static async handleMissionAcceptance(user: AppUser, content: string, state: any) {
        if (content.toLowerCase().includes('sim')) {
            await this.updateConversationState(state.conversationId, { step: 'waiting_mission_proof' });
            return `Excelente, ${user.name}! Desafio aceito. Quando você concluir a missão, me envie um pequeno texto descrevendo o que fez ou uma foto. Estou aguardando!`;
        }
        await this.updateConversationState(state.conversationId, { step: 'main', activeMissionId: null });
        return `Tudo bem, ${user.name}. Fica para a próxima! Posso te ajudar com algo mais?`;
    }

    /**
     * Fluxo de Prova de Conclusão da Missão
     */
    private static async handleMissionProof(user: AppUser, content: string, state: any) {
        // FIX: Guard contra state corrompido — activeMissionId pode ser null se o estado foi sobrescrito
        if (!state.activeMissionId) {
            await this.updateConversationState(state.conversationId, { step: 'main', activeMissionId: null });
            return `Obrigado pelo seu empenho, ${user.name}! Não encontrei uma missão ativa para registrar. Se isso parece um erro, entre em contato com a equipe.`;
        }
        const res = await MissionService.completeMission(user.id, state.activeMissionId, content);
        await this.updateConversationState(state.conversationId, { step: 'main', activeMissionId: null });
        
        return `🎉 *PARABÉNS!* Missão concluída com sucesso.\nVocê acaba de ganhar *${res?.points} pontos* e subiu no nosso ranking de liderança. Continue assim!`;
    }

    /**
     * Fluxo para novos contatos (Leads)
     */
    private static async handleNewLead(phone: string, name: string, content: string, state: any) {
        // Criar usuário inicial como Lead
        const newUser = {
            name,
            phone,
            role: 'citizen',
            status: 'lead',
            createdAt: new Date().toISOString(),
            profile: { isProfileComplete: false }
        };

        const userRef = await firestore.collection('users').add(newUser);
        
        await this.updateConversationState(state.conversationId, { step: 'asking_bairro' });

        return `Olá ${name}! Sou o Secretário Virtual do projeto. Vi que você ainda não tem um cadastro completo. Para começarmos, de qual bairro você é?`;
    }

    /**
     * Fluxo de Qualificação (Completar perfil)
     */
    private static async handleQualification(user: AppUser, content: string, state: any) {
        if (state.step === 'asking_bairro') {
            await firestore.collection('users').doc(user.id).update({
                bairro: content,
                'profile.isProfileComplete': false
            });
            await this.updateConversationState(state.conversationId, { step: 'asking_area' });
            return `Entendido! E em qual área você mais atua ou tem interesse? (Ex: Saúde, Educação, Esporte, Comércio...)`;
        }

        if (state.step === 'asking_area') {
            await firestore.collection('users').doc(user.id).update({
                areaAtuacao: content,
                status: 'qualificado',
                'profile.isProfileComplete': true
            });
            await this.updateConversationState(state.conversationId, { step: 'main' });
            return `Ótimo, seu perfil foi atualizado! Agora você faz parte da nossa base qualificada. Como posso te ajudar hoje? Você pode registrar uma demanda do seu bairro ou tirar dúvidas sobre o projeto.`;
        }

        return `Olá! Estamos finalizando seu cadastro. Poderia me dizer qual seu bairro?`;
    }

    /**
     * Fluxo Principal (IA Generativa com Base de Conhecimento)
     */
    private static async handleMainFlow(user: AppUser, content: string, state: any) {
        // 1. Buscar Contexto Relevante na Base de Conhecimento (RAG)
        const context = await KnowledgeBaseService.getRelevantContext(content);

        const prompt = `
            Você é o Secretário Virtual de um projeto político. 
            O usuário se chama ${user.name} e mora no bairro ${user.bairro}.
            Ele atua na área de ${user.areaAtuacao}.

            CONTEXTO OFICIAL DO PROJETO:
            """
            ${context || 'Use seu conhecimento geral cívico para responder educadamente, mas informe que ainda não temos propostas específicas cadastradas sobre este tema exato.'}
            """

            Histórico recente: ${JSON.stringify(state.history?.slice(-3))}

            Mensagem do usuário: "${content}"

            Objetivos:
            1. Responda baseado prioritariamente no CONTEXTO OFICIAL acima.
            2. Se o contexto for irrelevante para a pergunta, diga que vai consultar a equipe técnica.
            3. Se ele quiser registrar um problema/demanda, peça detalhes e diga que vai registrar.
            4. Se ele tiver dúvidas, responda de forma motivadora e cívica.
            5. Mantenha as respostas curtas (máximo 3 parágrafos).
            
            Diretriz Especial 1: Se ele mencionar um problema claro (buraco, falta de luz, etc), termine a resposta com "[REGISTRAR_DEMANDA]".
            Diretriz Especial 2: Se o usuário for um Administrador/Líder e pedir dados/relatórios (ex: "Quantos líderes?", "Resumo da semana"), responda educadamente e termine com "[ADMIN_QUERY]".
        `;

        const aiResponse = await generateText({ prompt, provider: 'gemini' });

        if (aiResponse.includes('[REGISTRAR_DEMANDA]')) {
            await this.registerDemand(user, content);
            return aiResponse.replace('[REGISTRAR_DEMANDA]', '').trim() + "\n\n✅ Registrei sua demanda no nosso sistema para acompanhamento!";
        }

        if (aiResponse.includes('[ADMIN_QUERY]') && (user.role === 'admin' || user.role === 'master' || user.role === 'lider')) {
            const reportData = await this.generateQuickReport(content);
            return aiResponse.replace('[ADMIN_QUERY]', '').trim() + `\n\n📊 *Relatório Rápido:*\n${reportData}`;
        }

        // Atualizar histórico
        const newHistory = [...(state.history || []), { role: 'user', content }, { role: 'assistant', content: aiResponse }];
        await this.updateConversationState(state.conversationId, { history: newHistory.slice(-10) });

        return aiResponse;
    }

    private static async registerDemand(user: AppUser, content: string) {
        await firestore.collection('chamados').add({
            userId: user.id,
            userName: user.name,
            bairro: user.bairro || 'Não informado',
            descricao: content,
            status: 'aberto',
            createdAt: new Date().toISOString(),
            tipo: 'IA_WHATSAPP'
        });
    }

    private static async generateQuickReport(queryText: string): Promise<string> {
        try {
            const usersSnap = await firestore.collection('users').get();
            const chamadosSnap = await firestore.collection('chamados').get();

            const totalUsers = usersSnap.size;
            const totalLeaders = usersSnap.docs.filter(d => d.data().role === 'lider' || d.data().role === 'leader').length;
            const openDemands = chamadosSnap.docs.filter(d => d.data().status === 'aberto').length;

            if (queryText.toLowerCase().includes('líder') || queryText.toLowerCase().includes('lider')) {
                return `Atualmente temos ${totalLeaders} líderes cadastrados na base.`;
            }

            if (queryText.toLowerCase().includes('demanda') || queryText.toLowerCase().includes('chamado')) {
                return `Existem ${openDemands} demandas abertas aguardando sua atenção.`;
            }

            return `Resumo atual:\n👥 Total de Pessoas: ${totalUsers}\n⭐ Líderes: ${totalLeaders}\n📝 Demandas Abertas: ${openDemands}`;
        } catch (error) {
            return "Não consegui acessar os dados em tempo real agora. Tente novamente em instantes.";
        }
    }
}
