// src/lib/messaging/evolution-provider.ts
/**
 * Evolution API Provider
 * Open-source WhatsApp API with QR Code connection
 */

import type {
    MessagingProvider,
    ProviderConfig,
    EvolutionConfig,
    SendResult,
    ConnectionState,
    QrCodeResult,
    CreateInstanceResult,
    DocumentPayload,
} from './types';

function assertEvolution(config: ProviderConfig): asserts config is EvolutionConfig {
    if (config.provider !== 'evolution') {
        throw new Error(`Expected evolution config, got ${config.provider}`);
    }
}

export class EvolutionProvider implements MessagingProvider {
    readonly type = 'evolution' as const;

    async sendText(phone: string, message: string, config: ProviderConfig): Promise<SendResult> {
        assertEvolution(config);

        const headers = {
            'Content-Type': 'application/json',
            'apikey': config.apiKey,
        };
        const payload = { number: phone, text: message.trim() };
        const url = `${config.apiUrl}/message/sendText/${config.instanceName}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || `API request failed with status ${response.status}`);
            }

            return { success: true, detail: 'Message sent to Evolution API queue.' };
        } catch (e: any) {
            return { success: false, detail: e.message || 'Unknown error during Evolution API call.' };
        }
    }

    async getConnectionState(config: ProviderConfig): Promise<ConnectionState> {
        assertEvolution(config);

        try {
            const response = await fetch(`${config.apiUrl}/instance/connect/${config.instanceName}`, {
                method: 'GET',
                headers: { 'apikey': config.apiKey },
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                return { state: 'error' };
            }

            const state = data?.instance?.state;
            if (state === 'open') {
                return { state: 'open' };
            }

            if (data?.base64) {
                return { state: 'connecting', qrCode: data.base64 };
            }

            return { state: 'disconnected' };
        } catch {
            return { state: 'error' };
        }
    }

    async getQrCode(config: ProviderConfig): Promise<QrCodeResult> {
        const connectionState = await this.getConnectionState(config);
        if (connectionState.qrCode) {
            return { available: true, base64: connectionState.qrCode };
        }
        return { available: false, message: connectionState.state === 'open' ? 'Already connected' : 'QR Code not available' };
    }

    async createInstance(instanceName: string, config: ProviderConfig): Promise<CreateInstanceResult> {
        assertEvolution(config);

        try {
            const response = await fetch(`${config.apiUrl}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': config.apiKey,
                },
                body: JSON.stringify({
                    instanceName: instanceName.trim(),
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = `Erro ${response.status} da Evolution API.`;
                if (data?.error === 'Instance already exists' || data?.message?.includes('already exists')) {
                    errorMessage = 'Já existe uma instância com esse nome na API da Evolution.';
                } else if (typeof data.message === 'string') {
                    errorMessage = data.message;
                } else if (Array.isArray(data.message) && data.message.length > 0) {
                    errorMessage = data.message.join(', ');
                }
                return { success: false, message: errorMessage };
            }

            return { success: true, data, message: 'Instância criada com sucesso. A aguardar QR Code.' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async deleteInstance(instanceName: string, config: ProviderConfig): Promise<CreateInstanceResult> {
        assertEvolution(config);

        try {
            const response = await fetch(`${config.apiUrl}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': config.apiKey },
            });

            if (!response.ok && response.status !== 404) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Falha ao remover da Evolution API: Status ${response.status}`);
            }

            return { success: true, message: 'Instância removida da Evolution API.' };
        } catch (e: any) {
            return { success: false, message: `Falha na comunicação com a API da Evolution: ${e.message}` };
        }
    }
}
