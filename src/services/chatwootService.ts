import { CHATWOOT_CONFIG, getChatwootHeaders } from '@/lib/chatwoot-config';

export class ChatwootService {
    private static baseUrl = CHATWOOT_CONFIG.baseUrl;
    private static accountId = CHATWOOT_CONFIG.accountId;
    private static inboxId = CHATWOOT_CONFIG.inboxId;

    /**
     * Normaliza telefone brasileiro para 12 dígitos conforme exigido pela API do Chatwoot/Baileys.
     *
     * Regra:
     *   - Remover tudo que não for dígito
     *   - Adicionar DDI 55 se for número local (10 ou 11 dígitos)
     *   - Remover o 9 extra de celulares pós-2012 (13 → 12 dígitos)
     *     Ex: "5561992856186" → "556192856186"
     *
     * Referência: docs/06-IA-CHATWOOT-INTEGRACAO.md § Normalização de Telefone (Seção 5 do CRM)
     */
    static normalizeBrazilianPhone(phone: string): string {
        let digits = phone.replace(/\D/g, '');

        // Remover zero inicial (discagem nacional)
        if (digits.startsWith('0')) digits = digits.substring(1);

        // Adicionar DDI 55 se for número nacional (10 ou 11 dígitos)
        if (digits.length === 10 || digits.length === 11) {
            digits = `55${digits}`;
        }

        // Strip do 9 extra em celulares brasileiros pós-2012 (55 + DDD + 9 + 8 = 13 dígitos)
        // O Baileys/WhatsApp usa JIDs de 12 dígitos; 13 dígitos resulta em JID inexistente.
        if (digits.length === 13 && digits[4] === '9') {
            digits = digits.slice(0, 4) + digits.slice(5);
        }

        return digits; // 12 dígitos, sem +
    }

    /**
     * Envia uma mensagem de texto para uma conversa específica
     */
    static async sendMessage(conversationId: number, content: string, messageType: 'outgoing' | 'incoming' = 'outgoing') {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                content,
                message_type: messageType,
                private: false,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[ChatwootService] Error sending message:', error);
            return { success: false, error };
        }

        return { success: true, data: await response.json() };
    }

    /**
     * Busca ou cria um contato pelo telefone.
     *
     * Regras de formatação (CRM reference doc):
     *   - phone_number do contato: E.164 com +  → "+556183013768"
     *   - Sempre usar 12 dígitos (sem o 9 extra de pós-2012)
     */
    static async findOrCreateContact(phone: string, name?: string): Promise<number> {
        const digits = this.normalizeBrazilianPhone(phone);
        const e164 = `+${digits}`;

        // 1. Buscar contato pelo número limpo (12 dígitos)
        const searchUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${digits}`;
        const searchRes = await fetch(searchUrl, {
            method: 'GET',
            headers: getChatwootHeaders(),
        });

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData?.payload?.length > 0) {
                return searchData.payload[0].id as number;
            }
        }

        // 2. Criar se não existir — usar E.164 (+digits) para phone_number do contato
        const createUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                phone_number: e164,
                name: name || `Apoiador ${digits.slice(-4)}`,
            }),
        });

        if (!createRes.ok) {
            const error = await createRes.text();
            console.error('[ChatwootService] Error creating contact:', error);
            throw new Error(`Failed to create contact: ${error}`);
        }

        const contactData = await createRes.json();
        return (contactData?.payload?.contact?.id || contactData?.id) as number;
    }

    /**
     * Busca ou cria uma conversa aberta para o contato.
     *
     * Regras de formatação (CRM reference doc):
     *   - source_id: SOMENTE dígitos (sem +), validação regex /^\d{1,15}$/
     *     "+556183013768" → INVÁLIDO (422 "Source invalid source id")
     *     "556183013768"  → VÁLIDO ✅
     *
     * Busca usando endpoint /contacts/{contactId}/conversations (mais preciso que /filter).
     */
    static async findOrCreateConversation(contactId: number, phone: string): Promise<number> {
        const digits = this.normalizeBrazilianPhone(phone); // source_id = sem +

        // 1. Buscar conversas do contato via endpoint dedicado (mais confiável que /filter)
        const listUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contactId}/conversations`;
        const listRes = await fetch(listUrl, {
            method: 'GET',
            headers: getChatwootHeaders(),
        });

        if (listRes.ok) {
            const listData = await listRes.json();
            const payload = listData?.payload ?? [];

            // Filtrar por inbox correto, status open e source_id numérico válido
            const inboxIdNum = this.inboxId ? parseInt(this.inboxId, 10) : undefined;
            const open = payload.find((conv: any) => {
                const sameInbox = inboxIdNum ? conv.inbox_id === inboxIdNum : true;
                const isOpen = conv.status === 'open';
                const validSourceId = /^\d{10,15}$/.test(conv.meta?.sender?.phone_number?.replace(/\D/g, '') ?? '');
                return sameInbox && isOpen && validSourceId;
            });

            if (open) return open.id as number;
        }

        // 2. Criar nova conversa — source_id deve ser SOMENTE dígitos (sem +)
        const createUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                source_id: digits, // ← SOMENTE dígitos, nunca com +
                contact_id: contactId,
                inbox_id: this.inboxId ? parseInt(this.inboxId, 10) : undefined,
            }),
        });

        if (!createRes.ok) {
            const error = await createRes.text();
            console.error('[ChatwootService] Error creating conversation:', error);
            throw new Error(`Failed to create conversation: ${error}`);
        }

        const convData = await createRes.json();
        return convData?.id as number;
    }

    /**
     * Atualiza atributos customizados de um contato no Chatwoot.
     * Útil para enriquecer o CRM com bairro, área de atuação e influência do usuário.
     *
     * Referência: CRM doc § Sincronização de Contatos (Seção 13)
     */
    static async updateContactAttributes(contactId: number, attrs: {
        bairro?: string;
        areaAtuacao?: string;
        influencia?: string | null;
        role?: string;
    }) {
        const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contactId}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                custom_attributes: {
                    bairro: attrs.bairro,
                    area_atuacao: attrs.areaAtuacao,
                    influencia: attrs.influencia,
                    perfil: attrs.role,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[ChatwootService] Error updating contact attributes:', error);
        }
    }
}
