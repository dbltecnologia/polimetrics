// src/lib/messaging/types.ts
/**
 * Multi-Provider Messaging Abstraction Layer
 * Supports: Evolution API, Z-API, Chatwoot
 */

export type ProviderType = 'evolution' | 'zapi' | 'chatwoot';

// --- Result Types ---

export interface SendResult {
    success: boolean;
    detail: string;
    data?: any;
}

export interface ConnectionState {
    state: 'open' | 'connecting' | 'disconnected' | 'error';
    qrCode?: string; // base64 QR code image (Evolution only)
}

export interface QrCodeResult {
    available: boolean;
    base64?: string;
    message?: string;
}

export interface CreateInstanceResult {
    success: boolean;
    data?: any;
    message: string;
}

// --- Document Payload ---

export interface DocumentPayload {
    filePath?: string;
    base64?: string;
    fileName: string;
    caption?: string;
    mimeType?: string;
}

// --- Provider Configuration ---

export interface EvolutionConfig {
    provider: 'evolution';
    apiUrl: string;
    apiKey: string;
    instanceName: string;
}

export interface ZApiConfig {
    provider: 'zapi';
    instanceId: string;
    token: string;
    clientToken: string;
    baseUrl?: string; // defaults to https://api.z-api.io/instances
}

export interface ChatwootConfig {
    provider: 'chatwoot';
    baseUrl: string;
    apiAccessToken: string;
    accountId: string;
    inboxId?: string;
}

export type ProviderConfig = EvolutionConfig | ZApiConfig | ChatwootConfig;

// --- Provider Interface (Strategy Pattern) ---

export interface MessagingProvider {
    readonly type: ProviderType;

    /** Send a text message to a phone number */
    sendText(phone: string, message: string, config: ProviderConfig): Promise<SendResult>;

    /** Send a document/file (optional — not all providers support it) */
    sendDocument?(phone: string, doc: DocumentPayload, config: ProviderConfig): Promise<SendResult>;

    /** Check connection state of an instance */
    getConnectionState?(config: ProviderConfig): Promise<ConnectionState>;

    /** Get QR code for connecting a new WhatsApp device */
    getQrCode?(config: ProviderConfig): Promise<QrCodeResult>;

    /** Create a new messaging instance */
    createInstance?(instanceName: string, config: ProviderConfig): Promise<CreateInstanceResult>;

    /** Delete a messaging instance */
    deleteInstance?(instanceName: string, config: ProviderConfig): Promise<CreateInstanceResult>;
}

// --- Firestore Schema Types ---

export interface MessagingInstance {
    id: string;
    name: string;
    ownerId: string;
    provider: ProviderType;
    status?: string;
    createdAt: any;
    config?: Partial<Omit<EvolutionConfig, 'provider'> & Omit<ZApiConfig, 'provider'> & Omit<ChatwootConfig, 'provider'>>;
}

// Labels for UI display
export const PROVIDER_LABELS: Record<ProviderType, string> = {
    evolution: 'Evolution API',
    zapi: 'Z-API',
    chatwoot: 'Chatwoot',
};

export const PROVIDER_DESCRIPTIONS: Record<ProviderType, string> = {
    evolution: 'Open-source, self-hosted. Conexão via QR Code.',
    zapi: 'SaaS. Credenciais manuais (Instance ID + Token).',
    chatwoot: 'Plataforma omnichannel. Requer servidor Chatwoot configurado.',
};
