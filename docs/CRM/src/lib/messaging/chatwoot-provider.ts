/// <reference types="node" />
// src/lib/messaging/chatwoot-provider.ts
/**
 * Chatwoot Provider
 * Omnichannel messaging platform — sends via Conversations API
 * Requires a pre-configured Chatwoot server with a WhatsApp inbox
 */

import type {
    MessagingProvider,
    ProviderConfig,
    ChatwootConfig,
    SendResult,
    ConnectionState,
    QrCodeResult,
    CreateInstanceResult,
} from './types';

function assertChatwoot(config: ProviderConfig): asserts config is ChatwootConfig {
    if (config.provider !== 'chatwoot') {
        throw new Error(`Expected chatwoot config, got ${config.provider}`);
    }
}

function getChatwootHeaders(config: ChatwootConfig): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'api_access_token': config.apiAccessToken,
    };
}

export class ChatwootProvider implements MessagingProvider {
    readonly type = 'chatwoot' as const;

    private getInternalBaseUrl(config: ChatwootConfig): string {
        const envUrl = process.env.CHATWOOT_BASE_URL;
        // Prioritizes internal backend 3002 port to bypass NGINX Devise Auth requirements
        if (envUrl && envUrl.includes('3002')) {
            return envUrl;
        }
        if (!config.baseUrl.includes('3002') && config.baseUrl.includes('sajur')) {
            return 'http://chatai.sajur.com.br:3002';
        }
        return config.baseUrl;
    }

    /**
     * Chatwoot sending flow:
     * 1. Search for existing contact by phone
     * 2. Create contact if not found
     * 3. Search for existing conversation
     * 4. Create conversation if not found
     * 5. Send message to conversation
     */
    async sendText(phone: string, message: string, config: ProviderConfig): Promise<SendResult> {
        assertChatwoot(config);

        try {
            // 1. Find or create contact
            const contactId = await this.findOrCreateContact(phone, config);

            // 2. Find or create conversation
            const conversationId = await this.findOrCreateConversation(contactId, phone, config);

            // 3. Send message
            const messageUrl = `${this.getInternalBaseUrl(config)}/api/v1/accounts/${config.accountId}/conversations/${conversationId}/messages`;
            const response = await fetch(messageUrl, {
                method: 'POST',
                headers: getChatwootHeaders(config),
                body: JSON.stringify({
                    content: message.trim(),
                    message_type: 'outgoing',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Chatwoot Error (${response.status})`);
            }

            const data = await response.json();
            return { success: true, detail: 'Message sent via Chatwoot.', data };
        } catch (e: any) {
            return { success: false, detail: e.message || 'Unknown error during Chatwoot call.' };
        }
    }

    private async findOrCreateContact(phone: string, config: ChatwootConfig): Promise<number> {
        const searchUrl = `${this.getInternalBaseUrl(config)}/api/v1/accounts/${config.accountId}/contacts/search?q=${phone}`;
        const searchRes = await fetch(searchUrl, {
            method: 'GET',
            headers: getChatwootHeaders(config),
        });

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData?.payload?.length > 0) {
                return searchData.payload[0].id;
            }
        }

        // Not found — create
        const createUrl = `${this.getInternalBaseUrl(config)}/api/v1/accounts/${config.accountId}/contacts`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(config),
            body: JSON.stringify({
                phone_number: phone.startsWith('+') ? phone : `+${phone}`,
                name: `Lead ${phone.slice(-4)}`,
            }),
        });

        if (!createRes.ok) {
            const errorRaw = await createRes.text();
            console.error(`Chatwoot create contact failed for ${phone}. Status: ${createRes.status}`, errorRaw);
            throw new Error(`Failed to create Chatwoot contact for ${phone}. Response: ${errorRaw}`);
        }

        const contactData = await createRes.json();
        return contactData?.payload?.contact?.id || contactData?.id;
    }

    private async findOrCreateConversation(contactId: number, phone: string, config: ChatwootConfig): Promise<number> {
        // Search for existing open conversation with this contact
        const filterUrl = `${this.getInternalBaseUrl(config)}/api/v1/accounts/${config.accountId}/conversations/filter`;
        const filterRes = await fetch(filterUrl, {
            method: 'POST',
            headers: getChatwootHeaders(config),
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

        const createUrl = `${this.getInternalBaseUrl(config)}/api/v1/accounts/${config.accountId}/conversations`;
        // For Native Baileys Chatwoot inboxes, source_id MUST be purely numeric (no @s.whatsapp.net)
        const whatsappSourceId = phone.replace(/\D/g, '');
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: getChatwootHeaders(config),
            body: JSON.stringify({
                source_id: whatsappSourceId,
                contact_id: contactId,
                inbox_id: config.inboxId ? parseInt(config.inboxId, 10) : undefined,
            }),
        });

        if (!createRes.ok) {
            const errorRaw = await createRes.text();
            console.error(`Chatwoot create conversation failed for contact ${contactId}. Status: ${createRes.status}`, errorRaw);
            throw new Error(`Failed to create Chatwoot conversation for contact ${contactId} (Inbox: ${config.inboxId}). Response: ${errorRaw}`);
        }

        const convData = await createRes.json();
        return convData?.id;
    }

    async getConnectionState(_config: ProviderConfig): Promise<ConnectionState> {
        // Chatwoot channels are managed via its own UI — no QR code polling
        return { state: 'open' };
    }

    async getQrCode(_config: ProviderConfig): Promise<QrCodeResult> {
        // Since we are provisioning Evolution behind the scenes for Chatwoot's WhatsApp
        // we can fetch the QR code directly from Evolution just like Evolution Provider does
        const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolutionapi.dbltecnologia.com.br';
        const evoApiKey = process.env.EVOLUTION_API_KEY || '';

        // Let's implement Evolution QR fetch directly if instanceName is provided in config.
        const name = 'instanceName' in _config ? _config.instanceName : undefined;

        if (!name) {
            return {
                available: false,
                message: 'Nome da instância não fornecido na configuração.',
            };
        }

        try {
            const response = await fetch(`${evoUrl}/instance/connect/${name}`, {
                method: 'GET',
                headers: { 'apikey': evoApiKey },
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                if (data?.base64) {
                    return { available: true, base64: data.base64 };
                }
                const state = data?.instance?.state || 'disconnected';
                if (state === 'open') {
                    return { available: false, message: 'WhatsApp já conectado.' };
                }
            }
            return { available: false, message: 'Aguardar geração de QR Code...' };
        } catch (error: any) {
            return { available: false, message: `Erro ao obter QR Code (Evolution Interno): ${error.message}` };
        }
    }

    async createInstance(_instanceName: string, _config: ProviderConfig): Promise<CreateInstanceResult> {
        return {
            success: true,
            message: 'Conexão Chatwoot registrada. As credenciais foram salvas no CRM.',
        };
    }

    async deleteInstance(_instanceName: string, _config: ProviderConfig): Promise<CreateInstanceResult> {
        return {
            success: true,
            message: 'Conexão Chatwoot removida do CRM.',
        };
    }
}
