/**
 * Configurações da Z-API para o Mapa Político
 * Centraliza as instâncias de disparo de mensagens WhatsApp
 *
 * Instância atual: criada em 22/03/2026
 * Painel: https://app.z-api.io
 */

export const ZAPI_CAMPAIGNS = {
    instance: "3F0842389FC5B298B5B66A3076259B07",
    token: "9F04D61967A6EE06600B72FC",
    clientToken: "F7882ce105227418fbde93ac1e166d7dbS",
    baseUrl: "https://api.z-api.io/instances"
} as const;

// Reutilizar a mesma instância para relatórios enquanto há só uma
export const ZAPI_REPORTS = ZAPI_CAMPAIGNS;

export type ZApiInstanceType = 'campaigns' | 'reports';

/**
 * Constrói a URL para chamadas da Z-API
 */
export function getZApiUrl(type: ZApiInstanceType, endpoint: string = 'send-text'): string {
    const config = ZAPI_CAMPAIGNS; // mesma instância para ambos
    return `${config.baseUrl}/${config.instance}/token/${config.token}/${endpoint}`;
}

/**
 * Retorna o objeto de configuração da instância
 */
export function getZApiConfig(type: ZApiInstanceType) {
    return ZAPI_CAMPAIGNS;
}
