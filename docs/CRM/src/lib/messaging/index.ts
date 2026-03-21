// src/lib/messaging/index.ts
/**
 * Messaging Provider Factory
 * Central entry point for multi-provider WhatsApp messaging
 */

import type { ProviderType, MessagingProvider, ProviderConfig, EvolutionConfig, ZApiConfig, ChatwootConfig } from './types';
import { EvolutionProvider } from './evolution-provider';
import { ZApiProvider } from './zapi-provider';
import { ChatwootProvider } from './chatwoot-provider';

// Singleton instances (stateless — safe to reuse)
const providers: Record<ProviderType, MessagingProvider> = {
    evolution: new EvolutionProvider(),
    zapi: new ZApiProvider(),
    chatwoot: new ChatwootProvider(),
};

/**
 * Get a messaging provider by type
 * @param type - Provider type ('evolution' | 'zapi' | 'chatwoot')
 * @returns MessagingProvider instance
 */
export function getProvider(type: ProviderType): MessagingProvider {
    const provider = providers[type];
    if (!provider) {
        throw new Error(`Unknown messaging provider: ${type}. Supported: evolution, zapi, chatwoot`);
    }
    return provider;
}

/**
 * Build the full ProviderConfig from Firestore instance data.
 * Merges environment fallbacks with instance-specific config.
 */
export function buildProviderConfig(
    provider: ProviderType,
    instanceName: string,
    instanceConfig?: Partial<Omit<ProviderConfig, 'provider'>>
): ProviderConfig {
    switch (provider) {
        case 'evolution':
            return {
                provider: 'evolution',
                apiUrl: (instanceConfig as any)?.apiUrl || process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolutionapi.dbltecnologia.com.br',
                apiKey: (instanceConfig as any)?.apiKey || process.env.EVOLUTION_API_KEY || '',
                instanceName: instanceName,
            } satisfies EvolutionConfig;

        case 'zapi':
            return {
                provider: 'zapi',
                instanceId: (instanceConfig as any)?.instanceId || process.env.ZAPI_INSTANCE_ID || '',
                token: (instanceConfig as any)?.token || process.env.ZAPI_TOKEN || '',
                clientToken: (instanceConfig as any)?.clientToken || process.env.ZAPI_CLIENT_TOKEN || '',
                baseUrl: (instanceConfig as any)?.baseUrl || process.env.ZAPI_BASE_URL || 'https://api.z-api.io/instances',
            } satisfies ZApiConfig;

        case 'chatwoot':
            return {
                provider: 'chatwoot',
                baseUrl: (instanceConfig as any)?.baseUrl || process.env.CHATWOOT_BASE_URL || 'http://chatai.sajur.com.br:3002',
                apiAccessToken: (instanceConfig as any)?.apiAccessToken || process.env.CHATWOOT_ADMIN_TOKEN || '',
                accountId: (instanceConfig as any)?.accountId || process.env.CHATWOOT_ACCOUNT_ID || '',
                inboxId: (instanceConfig as any)?.inboxId || process.env.CHATWOOT_INBOX_ID || undefined,
            } satisfies ChatwootConfig;

        default:
            throw new Error(`Cannot build config for unknown provider: ${provider}`);
    }
}

// Re-export all types for convenient imports
export * from './types';
