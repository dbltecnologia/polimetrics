/**
 * Configurações da Z-API para o Mapa Político
 * Centraliza as instâncias de disparo de mensagens WhatsApp
 */

export const ZAPI_CAMPAIGNS = {
    instance: "3EF3DD8E8DF2929F0A4B32059B4CF0B7",
    token: "25AF05D80C08863D405381A1",
    clientToken: "Fbcb4990fc6354bcb84403136453b96b6S",
    baseUrl: "https://api.z-api.io/instances"
} as const;

export const ZAPI_REPORTS = {
    instance: "3ED6D5FD899112FA4591C64A3C546F10",
    token: "A0F09FFC680CE22B2B376C7C",
    clientToken: "F4401396fa6cc41249ac1821484aa7478S",
    baseUrl: "https://api.z-api.io/instances"
} as const;

export type ZApiInstanceType = 'campaigns' | 'reports';

/**
 * Constrói a URL para chamadas da Z-API
 */
export function getZApiUrl(type: ZApiInstanceType, endpoint: string = 'send-text'): string {
    const config = type === 'campaigns' ? ZAPI_CAMPAIGNS : ZAPI_REPORTS;
    return `${config.baseUrl}/${config.instance}/token/${config.token}/${endpoint}`;
}

/**
 * Retorna o objeto de configuração da instância
 */
export function getZApiConfig(type: ZApiInstanceType) {
    return type === 'campaigns' ? ZAPI_CAMPAIGNS : ZAPI_REPORTS;
}
