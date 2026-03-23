import { ChatwootService } from '../chatwootService';
import { ZApiProvider } from './zapi-provider';
import { ZApiInstanceType } from '@/lib/zapi-config';

export type MessagingProviderType = 'chatwoot' | 'zapi';

export interface SendMessageOptions {
    phone: string;
    message: string;
    provider?: MessagingProviderType;
    zapiInstance?: ZApiInstanceType;
    /**
     * If using Chatwoot, you can explicitly pass the conversation ID 
     * if you already have it (e.g. inside a webhook).
     */
    chatwootConversationId?: number;
    /**
     * If using Chatwoot and it needs to create a contact, it can use this name.
     */
    contactName?: string;
}

export class MessagingHub {
    /**
     * Envia uma mensagem de texto roteando para o provedor apropriado (Z-API ou Chatwoot).
     * 
     * @param options Configurações de envio e roteamento
     */
    static async sendText(options: SendMessageOptions): Promise<{ success: boolean; error?: any; conversationId?: number }> {
        const provider = options.provider || 'zapi';

        if (provider === 'zapi') {
            return await ZApiProvider.sendText({
                phone: options.phone,
                message: options.message,
                instanceType: options.zapiInstance || 'campaigns',
            });
        } 
        
        if (provider === 'chatwoot') {
            try {
                let conversationId = options.chatwootConversationId;
                
                // If we don't have conversation ID, we need to find or create the contact & conversation
                if (!conversationId) {
                    const contactId = await ChatwootService.findOrCreateContact(options.phone, options.contactName);
                    conversationId = await ChatwootService.findOrCreateConversation(contactId, options.phone);
                }

                const result = await ChatwootService.sendMessage(conversationId, options.message, 'outgoing');
                return { ...result, conversationId };
            } catch (error) {
                console.error('[MessagingHub] Chatwoot error:', error);
                return { success: false, error };
            }
        }

        return { success: false, error: 'Provedor inválido.' };
    }
}
