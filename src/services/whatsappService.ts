import { getZApiUrl, ZApiInstanceType } from '@/lib/zapi-config';
import { ChatwootService } from './chatwootService';

interface SendTextMessageOptions {
    phone: string;
    message: string;
    instanceType?: ZApiInstanceType;
}

interface ZApiResponse {
    zaapId?: string;
    messageId?: string;
    error?: string;
}

/**
 * Envia uma mensagem de texto simples via WhatsApp
 */
export async function sendWhatsAppMessage({ 
    phone, 
    message, 
    instanceType = 'campaigns' 
}: SendTextMessageOptions): Promise<{ success: boolean; data?: ZApiResponse; error?: any }> {
    try {
        const url = getZApiUrl(instanceType, 'send-text');
        const formattedPhone = ChatwootService.normalizeBrazilianPhone(phone);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // A Z-API usa o token na URL, mas se precisarmos de client-token no header:
                // 'client-token': getZApiConfig(instanceType).clientToken
            },
            body: JSON.stringify({
                phone: formattedPhone,
                message: message
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro ao enviar mensagem via Z-API:', data);
            return { success: false, error: data };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Erro na requisição ao Z-API:', error);
        return { success: false, error };
    }
}

/**
 * Envia uma mensagem com imagem (Opcional, se precisar de santinhos/propostas)
 */
export async function sendWhatsAppImage({ 
    phone, 
    imageUrl, 
    caption,
    instanceType = 'campaigns' 
}: { 
    phone: string; 
    imageUrl: string; 
    caption?: string; 
    instanceType?: ZApiInstanceType 
}) {
    try {
        const url = getZApiUrl(instanceType, 'send-image');
        const formattedPhone = ChatwootService.normalizeBrazilianPhone(phone);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: formattedPhone,
                image: imageUrl,
                caption: caption
            }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('Erro ao enviar imagem via Z-API:', data);
            return { success: false, error: data };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao enviar imagem via Z-API:', error);
        return { success: false, error };
    }
}
