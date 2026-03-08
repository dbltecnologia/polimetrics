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

/**
 * Formata o número de telefone para o padrão esperado pela Z-API
 * @param phone - Número de telefone (com ou sem DDD)
 */
function formatWhatsAppNumber(phone: string): string {
    // Remove tudo que não for número
    let cleaned = phone.replace(/\D/g, '');

    // Se começar com 0, remove
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Se não tiver o código do país (55), adiciona
    if (cleaned.length <= 11 && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }

    // Z-API prefere o número completo sem o 9 extra (dependendo da região)
    // mas geralmente aceita o número como está se estiver com o 55
    return cleaned;
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
        const formattedPhone = formatWhatsAppNumber(phone);

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
        const formattedPhone = formatWhatsAppNumber(phone);

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

        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar imagem via Z-API:', error);
        return { success: false, error };
    }
}
