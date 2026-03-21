import { CHATWOOT_CONFIG, getChatwootHeaders } from '@/lib/chatwoot-config';

export class ChatwootService {
    private static baseUrl = CHATWOOT_CONFIG.baseUrl;
    private static accountId = CHATWOOT_CONFIG.accountId;
    private static inboxId = CHATWOOT_CONFIG.inboxId;

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
     * Busca ou cria um contato pelo telefone
     */
    static async findOrCreateContact(phone: string, name?: string) {
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

        // 1. Buscar contato
        const searchUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search?q=${cleanPhone}`;
        const searchRes = await fetch(searchUrl, {
            method: 'GET',
            headers: getChatwootHeaders(),
        });

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData?.payload?.length > 0) {
                return searchData.payload[0].id;
            }
        }

        // 2. Criar se não existir
        const createUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                phone_number: formattedPhone,
                name: name || `Líder ${cleanPhone.slice(-4)}`,
            }),
        });

        if (!createRes.ok) {
            const error = await createRes.text();
            console.error('[ChatwootService] Error creating contact:', error);
            throw new Error(`Failed to create contact: ${error}`);
        }

        const contactData = await createRes.json();
        return contactData?.payload?.contact?.id || contactData?.id;
    }

    /**
     * Busca ou cria uma conversa aberta para o contato
     */
    static async findOrCreateConversation(contactId: number, phone: string) {
        // 1. Buscar conversas abertas
        const filterUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/filter`;
        const filterRes = await fetch(filterUrl, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                payload: [
                    {
                        attribute_key: 'contact_id',
                        filter_operator: 'equal_to',
                        values: [contactId],
                    },
                    {
                        attribute_key: 'status',
                        filter_operator: 'equal_to',
                        values: ['open'],
                    },
                ],
            }),
        });

        if (filterRes.ok) {
            const filterData = await filterRes.json();
            if (filterData?.payload?.length > 0) {
                return filterData.payload[0].id;
            }
        }

        // 2. Criar nova conversa
        const createUrl = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`;
        const sourceId = phone.replace(/\D/g, '');
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(),
            body: JSON.stringify({
                source_id: sourceId,
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
        return convData?.id;
    }
}
