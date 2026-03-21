/**
 * Configurações do Chatwoot para o Secretário Virtual
 */

export const CHATWOOT_CONFIG = {
    baseUrl: process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
    apiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN || '',
    accountId: process.env.CHATWOOT_ACCOUNT_ID || '',
    inboxId: process.env.CHATWOOT_INBOX_ID || '',
};

export function getChatwootHeaders() {
    return {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_CONFIG.apiAccessToken,
    };
}
