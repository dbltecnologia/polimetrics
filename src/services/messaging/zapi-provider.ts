import { getZApiUrl, ZApiInstanceType } from '@/lib/zapi-config';

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

export class ZApiProvider {
    /**
     * Z-API expects purely digits. We'll strip all non-digits.
     * The phone should have 12 or 13 digits depending on if it has the extra 9.
     * Z-API is fine with both, but usually we send exactly what we have without stripping the 9,
     * unlike Chatwoot/Baileys.
     */
    static normalizePhone(phone: string): string {
        let digits = phone.replace(/\D/g, '');
        if (digits.startsWith('0')) digits = digits.substring(1);
        if (digits.length === 10 || digits.length === 11) {
            digits = `55${digits}`;
        }
        return digits;
    }

    /**
     * Envia uma mensagem de texto simples via WhatsApp Z-API
     */
    static async sendText({ 
        phone, 
        message, 
        instanceType = 'campaigns' 
    }: SendTextMessageOptions): Promise<{ success: boolean; data?: ZApiResponse; error?: any }> {
        try {
            const url = getZApiUrl(instanceType, 'send-text');
            const formattedPhone = this.normalizePhone(phone);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: formattedPhone,
                    message: message
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[ZApiProvider] Erro ao enviar mensagem:', data);
                return { success: false, error: data };
            }

            return { success: true, data };
        } catch (error) {
            console.error('[ZApiProvider] Erro na requisição:', error);
            return { success: false, error };
        }
    }

    /**
     * Envia uma mensagem com imagem
     */
    static async sendImage({ 
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
            const formattedPhone = this.normalizePhone(phone);

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
                console.error('[ZApiProvider] Erro ao enviar imagem:', data);
                return { success: false, error: data };
            }
            return { success: true, data };
        } catch (error) {
            console.error('[ZApiProvider] Erro ao enviar imagem:', error);
            return { success: false, error };
        }
    }
}
