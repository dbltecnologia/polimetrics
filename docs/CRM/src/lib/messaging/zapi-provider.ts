// src/lib/messaging/zapi-provider.ts
/**
 * Z-API Provider
 * SaaS WhatsApp API — credentials entered manually by user
 * Reference: docs/z-api/zapi_integration_guide.md
 */

import type {
    MessagingProvider,
    ProviderConfig,
    ZApiConfig,
    SendResult,
    ConnectionState,
    QrCodeResult,
    CreateInstanceResult,
    DocumentPayload,
} from './types';

const DEFAULT_ZAPI_BASE_URL = 'https://api.z-api.io/instances';

function assertZApi(config: ProviderConfig): asserts config is ZApiConfig {
    if (config.provider !== 'zapi') {
        throw new Error(`Expected zapi config, got ${config.provider}`);
    }
}

function buildZApiUrl(config: ZApiConfig, endpoint: string): string {
    const baseUrl = config.baseUrl || DEFAULT_ZAPI_BASE_URL;
    return `${baseUrl}/${config.instanceId}/token/${config.token}/${endpoint}`;
}

function getZApiHeaders(config: ZApiConfig): Record<string, string> {
    return {
        'Client-Token': config.clientToken,
        'Content-Type': 'application/json',
    };
}

export class ZApiProvider implements MessagingProvider {
    readonly type = 'zapi' as const;

    async sendText(phone: string, message: string, config: ProviderConfig): Promise<SendResult> {
        assertZApi(config);

        const url = buildZApiUrl(config, 'send-text');
        const headers = getZApiHeaders(config);
        const payload = {
            phone: phone,
            message: message.trim(),
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Z-API Error (${response.status}): ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, detail: 'Message sent to Z-API queue.', data };
        } catch (e: any) {
            return { success: false, detail: e.message || 'Unknown error during Z-API call.' };
        }
    }

    async sendDocument(phone: string, doc: DocumentPayload, config: ProviderConfig): Promise<SendResult> {
        assertZApi(config);

        const ext = doc.fileName.split('.').pop()?.toLowerCase() || 'pdf';
        const url = buildZApiUrl(config, `send-document/${ext}`);
        const headers = getZApiHeaders(config);

        const payload: any = {
            phone: phone,
            caption: doc.caption || doc.fileName,
        };

        if (doc.base64) {
            payload.document = doc.base64;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(60000), // 60s timeout for documents
            });

            if (!response.ok) {
                throw new Error(`Z-API document send failed: Status ${response.status}`);
            }

            return { success: true, detail: 'Document sent via Z-API.' };
        } catch (e: any) {
            return { success: false, detail: e.message || 'Unknown error sending document via Z-API.' };
        }
    }

    async getConnectionState(_config: ProviderConfig): Promise<ConnectionState> {
        // Z-API does not have a polling/connection state API like Evolution.
        // Connection is managed through the Z-API dashboard at z-api.io
        return { state: 'open' };
    }

    async getQrCode(_config: ProviderConfig): Promise<QrCodeResult> {
        return {
            available: false,
            message: 'Z-API não usa QR Code pelo CRM. Conecte seu WhatsApp pelo painel em z-api.io.',
        };
    }

    // Z-API instances are created/managed via their dashboard — no API for instance creation
    async createInstance(_instanceName: string, _config: ProviderConfig): Promise<CreateInstanceResult> {
        return {
            success: true,
            message: 'Instância Z-API registrada. As credenciais foram salvas no CRM.',
        };
    }

    async deleteInstance(_instanceName: string, _config: ProviderConfig): Promise<CreateInstanceResult> {
        return {
            success: true,
            message: 'Instância Z-API removida do CRM. Para remover da Z-API, acesse o painel em z-api.io.',
        };
    }
}
