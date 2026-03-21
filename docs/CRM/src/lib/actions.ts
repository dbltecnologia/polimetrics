/// <reference types="node" />
// src/lib/actions.ts
'use server';

import { collection, getDocs, Timestamp, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, writeBatch, limit, getDoc, where, deleteDoc, setDoc, CollectionReference, startAfter, collectionGroup, increment } from 'firebase/firestore';
import { db } from './firebase';
import { randomBytes, createHash } from 'crypto';
import { subDays } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { auth as adminAuth } from './firebase-admin';
import { runCampaignWorker } from '@/ai/flows/run-campaign-worker-flow';
import type { CampaignStats, Company, Contact } from '@/types/ai-types';
import { getProvider, buildProviderConfig } from './messaging';
import type { ProviderType, MessagingInstance } from './messaging';


const defaultFunnelStages = ["Novo", "Em Pesquisa", "Primeiro Contato", "Em Follow-up", "Reunião Agendada", "Proposta Enviada", "Ganhamos", "Perdemos", "Inválido"];

// Helper to convert Firestore Timestamps to plain objects
const convertTimestamps = (data: any): any => {
    const isTimestamp = (value: any): value is Timestamp => {
        return value && typeof value.toDate === 'function';
    };

    if (isTimestamp(data)) {
        return { seconds: data.seconds, nanoseconds: data.nanoseconds };
    }

    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }

    if (data !== null && typeof data === 'object' && !isTimestamp(data)) {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = convertTimestamps(data[key]);
            }
        }
        return newObj;
    }
    return data;
};

/**
 * Reset a funnel campaign: 
 * Sets the funnel status back to published, resets stats, and turns Contatado/Falhou items back to Pendente.
 */
export async function resetFunnelCampaign(funnelId: string) {
    try {
        const funnelRef = doc(db, 'uploads', funnelId);

        // Reset funnel status
        await updateDoc(funnelRef, {
            campaignStatus: 'published',
            'campaignStats.sent': 0,
            'campaignStats.failed': 0,
        });

        // Reset plan items
        const plansRef = collection(db, 'uploads', funnelId, 'outreachPlans');
        const plansSnap = await getDocs(plansRef);

        for (const planDoc of plansSnap.docs) {
            const planData = planDoc.data();
            let updatedCount = 0;

            if (planData.planData && Array.isArray(planData.planData)) {
                const updatedItems = planData.planData.map((item: any) => {
                    if (item.status === 'Contatado' || item.status === 'Falhou') {
                        updatedCount++;
                        return { ...item, status: 'Pendente', agentNotes: '' };
                    }
                    return item;
                });

                if (updatedCount > 0) {
                    await updateDoc(planDoc.ref, { planData: updatedItems });
                }
            }
        }

        return { success: true, message: 'Funil resetado com sucesso!' };
    } catch (error: any) {
        console.error("Error resetting funnel:", error);
        return { success: false, message: error.message };
    }
}

// ----------------------------------------------------------------------------
// ++ Messaging Instance Management (Multi-Provider: Evolution, Z-API, Chatwoot) ++
export type { MessagingInstance } from './messaging';

// Backward-compat alias
export type EvolutionInstance = MessagingInstance;

export async function getMessagingInstances(userId?: string): Promise<MessagingInstance[]> {
    if (!userId) {
        return [];
    }

    try {
        // Read from both collections for backward compat
        const allInstances: MessagingInstance[] = [];

        // 1. New collection: messagingInstances
        const newRef = collection(db, 'messagingInstances');
        const qNew = query(newRef, where('ownerId', '==', userId));
        const newSnapshot = await getDocs(qNew);

        for (const d of newSnapshot.docs) {
            const data = d.data();
            const provider = (data.provider || 'evolution') as ProviderType;
            let status = 'disconnected';

            // Only check connection state for Evolution (it has QR Code flow)
            if (provider === 'evolution') {
                try {
                    const state = await getInstanceConnectionState(data.name, provider, data.config);
                    status = state.data?.state || 'disconnected';
                } catch { status = 'error'; }
            } else {
                status = 'open'; // Z-API/Chatwoot manage connection externally
            }

            allInstances.push({
                id: d.id,
                name: data.name,
                ownerId: data.ownerId,
                provider,
                status,
                createdAt: convertTimestamps(data.createdAt),
                config: data.config,
            });
        }

        // 2. Legacy collection: evolutionInstances (backward compat)
        const legacyRef = collection(db, 'evolutionInstances');
        const qLegacy = query(legacyRef, where('ownerId', '==', userId));
        const legacySnapshot = await getDocs(qLegacy);

        for (const d of legacySnapshot.docs) {
            // Skip if already migrated to new collection
            if (allInstances.some(i => i.name === d.data().name)) continue;

            const data = d.data();
            let status = 'disconnected';
            try {
                const state = await getInstanceConnectionState(data.name, 'evolution');
                status = state.data?.state || 'disconnected';
            } catch { status = 'error'; }

            allInstances.push({
                id: d.id,
                name: data.name,
                ownerId: data.ownerId,
                provider: 'evolution',
                status,
                createdAt: convertTimestamps(data.createdAt),
            });
        }

        return allInstances.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    } catch (error) {
        console.error("Error fetching messaging instances:", error);
        throw new Error("Failed to fetch messaging instances from Firestore.");
    }
}

// Backward-compat alias
export const getEvolutionInstances = getMessagingInstances;


export async function setFunnelMessagingInstance(
    funnelId: string,
    instanceName: string,
    provider: ProviderType = 'evolution'
): Promise<{ success: boolean }> {
    if (!funnelId || !instanceName) {
        throw new Error("Funnel ID and Instance Name are required.");
    }

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        await updateDoc(funnelDocRef, {
            evolutionInstanceName: instanceName, // Keep for backward compat
            messagingProvider: provider,
            messagingInstanceName: instanceName,
        });
        revalidatePath('/funnels');
        return { success: true };
    } catch (error) {
        console.error('Error setting funnel messaging instance:', error);
        throw new Error("Failed to associate messaging instance with the funnel.");
    }
}

// Backward-compat alias
export const setFunnelEvolutionInstance = setFunnelMessagingInstance;

export async function createMessagingInstance(
    instanceName: string,
    userId: string,
    provider: ProviderType = 'evolution',
    providerConfig?: Record<string, string>
): Promise<{ success: boolean; data?: any; message: string }> {
    'use server';

    if (!instanceName || instanceName.trim() === '') {
        return { success: false, message: 'O nome da instância é obrigatório.' };
    }
    if (!userId) {
        return { success: false, message: 'O ID do usuário é obrigatório.' };
    }

    try {
        // 1. Check for duplicates across both collections
        const q1 = query(collection(db, 'messagingInstances'), where('name', '==', instanceName.trim()));
        const q2 = query(collection(db, 'evolutionInstances'), where('name', '==', instanceName.trim()));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        if (!snap1.empty || !snap2.empty) {
            return { success: false, message: 'Já existe uma instância com esse nome em nosso sistema.' };
        }

        // 2. Route creation to the appropriate provider
        const messagingProvider = getProvider(provider);
        const config = buildProviderConfig(provider, instanceName.trim(), providerConfig);
        let apiResult: { success: boolean; data?: any; message: string } = { success: true, message: '' };

        if (messagingProvider.createInstance) {
            apiResult = await messagingProvider.createInstance(instanceName.trim(), config);
            if (!apiResult.success) {
                return apiResult;
            }
        }

        // --- CHATWOOT: manual config OR auto-provisioning ---
        if (provider === 'chatwoot') {
            const hasManualConfig = providerConfig?.baseUrl && providerConfig?.apiAccessToken && providerConfig?.accountId;
            if (hasManualConfig) {
                // Manual mode: credentials already provided, save directly to Firestore.
                console.log('[Chatwoot] Manual config provided, skipping auto-provisioning.');
            } else {
                // Auto mode: provision via Admin Account
                const adminToken = process.env.CHATWOOT_ADMIN_TOKEN || process.env.CHATWOOT_SUPERADMIN_TOKEN;
                const adminAccountId = process.env.CHATWOOT_ACCOUNT_ID || '1';
                const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'http://chatai.agenticx.ia.br:3002'; // Fazer-AI default url

                if (!adminToken) {
                    return { success: false, message: 'Admin Token responsavel pela conta Fazer-AI não configurado.' };
                }

                let createdInboxId: number | null = null;
                const accountId = Number(adminAccountId);
                const userAccessToken = adminToken;

                try {
                    // 1 & 2. Bypassed isolated account creation. All CRM WhatsApp instances are Inboxes in the centralized Admin Account.

                    // 3. Create Inbox (WhatsApp type for Native Baileys)
                    
                    // Allow external phone number passing, fallback to generated mock
                    let assignedPhoneNumber = providerConfig?.phoneNumber?.replace(/\D/g, ''); 
                    if (assignedPhoneNumber && !assignedPhoneNumber.startsWith("+")) {
                        assignedPhoneNumber = `+${assignedPhoneNumber}`; // Ensure + prefix
                    }
                    if (!assignedPhoneNumber || assignedPhoneNumber.length < 10) {
                         assignedPhoneNumber = `+5500${Math.floor(100000000 + Math.random() * 900000000)}`;
                    }

                    const inboxRes = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/inboxes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'api_access_token': userAccessToken },
                        body: JSON.stringify({
                            name: `WhatsApp - ${instanceName.trim()}`,
                            channel: {
                                type: 'whatsapp',
                                provider: 'baileys',
                                phone_number: assignedPhoneNumber
                            }
                        })
                    });

                    if (!inboxRes.ok) {
                        const err = await inboxRes.text();
                        console.error("Chatwoot Inbox Creation Failed:", err);
                        if (inboxRes.status === 422 && (err.toLowerCase().includes('taken') || err.toLowerCase().includes('uso') || err.toLowerCase().includes('já existe'))) {
                            return { success: false, message: 'Este número de telefone já está conectado a outra Instância antiga no provedor! Exclua a instância antiga na lixeira antes de usar este número novamente.' };
                        }
                        return { success: false, message: 'Falha ao criar caixa de entrada de WhatsApp nativa no Chatwoot Admin (Verifique o log de Servidor).' };
                    }

                    const inboxData = await inboxRes.json();
                    const inboxId = inboxData.id;
                    createdInboxId = inboxId;

                    // 4. Create Webhook for the CRM (if not exists, to avoid duplicates on the single Admin Account)
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agenticx.ia';
                    const targetWebhookUrl = `${appUrl}/api/webhooks/chatwoot`;

                    const webhooksRes = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/webhooks`, {
                        headers: { 'api_access_token': userAccessToken }
                    });
                    
                    let webhookExists = false;
                    if (webhooksRes.ok) {
                         try {
                             const existingWebhooks = await webhooksRes.json();
                             // Chatwoot may return { payload: [...] } or direct [...] or unexpected {}
                             const payload = existingWebhooks?.payload;
                             const webhooksArr = Array.isArray(payload) ? payload : (Array.isArray(existingWebhooks) ? existingWebhooks : []);
                             webhookExists = webhooksArr.some((w: any) => w?.url === targetWebhookUrl);
                         } catch (parseError) {
                             console.warn("Failed to parse webhooks response:", parseError);
                         }
                    }

                    if (!webhookExists) {
                        const webhookRes = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/webhooks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'api_access_token': userAccessToken },
                            body: JSON.stringify({
                                webhook: {
                                    url: targetWebhookUrl,
                                    subscriptions: ['message_created', 'message_updated', 'conversation_created', 'conversation_status_changed', 'conversation_updated', 'contact_created', 'contact_updated']
                                }
                            })
                        });
                        if (!webhookRes.ok) console.warn(`Failed to create webhook:`, await webhookRes.text());
                    }

                    // 5. Trigger Native Chatwoot Provider Setup
                    // Instead of hitting Baileys directly (which might be firewalled), we trigger Chatwoot's API
                    // so it orchestrates the Baileys connection setup internally and updates the QR Code.
                    try {
                        const setupRes = await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/inboxes/${createdInboxId}/setup_channel_provider`, {
                            method: 'POST',
                            headers: { 'api_access_token': adminToken! },
                            cache: 'no-store'
                        });
                        
                        if (!setupRes.ok) {
                            console.warn("setup_channel_provider API result:", await setupRes.text());
                        }
                    } catch (e: any) {
                        console.error("Failed to trigger Chatwoot channel setup async:", e);
                    }

                    // Overwrite providerConfig with the AUTO-GENERATED credentials so they are saved to Firestore
                    if (!providerConfig) providerConfig = {};
                    providerConfig.baseUrl = chatwootBaseUrl;
                    providerConfig.apiAccessToken = userAccessToken;
                    providerConfig.accountId = accountId.toString();
                    providerConfig.inboxId = inboxId.toString();
                    providerConfig.phoneNumber = assignedPhoneNumber;

                } catch (e: any) {
                    console.error("Exception during Chatwoot Automation:", e);

                    // --- ROLLBACK LOGIC ---
                    // If Baileys initialization fails, we delete the Chatwoot Inbox to prevent ghost resources.
                    if (createdInboxId) {
                        try {
                            console.log(`Rolling back Chatwoot Inbox: ${createdInboxId}`);
                            await fetch(`${chatwootBaseUrl}/api/v1/accounts/${accountId}/inboxes/${createdInboxId}`, {
                                method: 'DELETE',
                                headers: { 'api_access_token': adminToken! }
                            });
                        } catch (rollbackError) {
                            console.error(`Failed to rollback Chatwoot inbox ${createdInboxId}:`, rollbackError);
                        }
                    }

                    const causeMsg = e.cause ? ` [Causa: ${e.cause.message || e.cause}]` : '';
                    return { success: false, message: `Falha na automação (fetch failed): ${e.message}${causeMsg}. Verifique os logs de servidor (Next.js/AppHosting) ou port forwarding (a porta 3002 está aberta para IPs externos?).` };
                }
            } // end else (auto mode)
        } // end if (provider === 'chatwoot')

        // 3. Save to Firestore (new collection)
        const instanceDoc: Record<string, any> = {
            name: instanceName.trim(),
            ownerId: userId,
            provider: provider,
            createdAt: serverTimestamp(),
        };

        // Save provider-specific config (Z-API tokens, Chatwoot URL, etc.)
        if (providerConfig && Object.keys(providerConfig).length > 0) {
            instanceDoc.config = providerConfig;
        }

        const newDocRef = await addDoc(collection(db, 'messagingInstances'), instanceDoc);

        return {
            success: true,
            data: { ...apiResult.data, instance: { id: newDocRef.id, ...instanceDoc, createdAt: new Date().toISOString() } },
            message: apiResult.message || 'Instância criada com sucesso.',
        };
    } catch (error: any) {
        console.error('Erro ao criar instância de mensageria:', error);
        return { success: false, message: error.message };
    }
}

// Backward-compat alias
export const createEvolutionInstance = (instanceName: string, userId: string) =>
    createMessagingInstance(instanceName, userId, 'evolution');

export async function updateMessagingInstance(
    instanceId: string,
    instanceName: string,
    provider: ProviderType,
    providerConfig: Record<string, string>
): Promise<{ success: boolean; message: string }> {
    'use server';

    if (!instanceId) return { success: false, message: 'O ID da instância é obrigatório.' };
    if (!instanceName || instanceName.trim() === '') return { success: false, message: 'O nome da instância é obrigatório.' };

    try {
        // We only allow updating the new messagingInstances collection to keep it simple
        const instanceRef = doc(db, 'messagingInstances', instanceId);

        const updateData: Record<string, any> = {
            name: instanceName.trim(),
            config: providerConfig,
        };

        await updateDoc(instanceRef, updateData);

        return { success: true, message: 'Instância atualizada com sucesso.' };
    } catch (error: any) {
        console.error('Erro ao atualizar instância:', error);
        return { success: false, message: error.message || 'Erro ao atualizar a instância.' };
    }
}

export async function deleteMessagingInstance(
    instanceName: string,
    docId: string,
    provider: ProviderType = 'evolution',
    instanceConfig?: Record<string, any>
): Promise<{ success: boolean; message: string }> {
    // 1. Route deletion to the appropriate provider
    const messagingProvider = getProvider(provider);
    if (messagingProvider.deleteInstance) {
        const config = buildProviderConfig(provider, instanceName, instanceConfig);
        const result = await messagingProvider.deleteInstance(instanceName, config);
        if (!result.success) {
            return result;
        }
    }

    // --- NEW CHATWOOT AUTO-CLEANUP LOGIC ---
    // Deleting a chatwoot instance means we must ALSO delete the underlying
    // Evolution API instance that we provisioned for its WhatsApp connection
    // AND delete the Chatwoot Account itself (since we have 1 Account per client)
    if (provider === 'chatwoot') {
        const evoUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolutionapi.dbltecnologia.com.br';
        const evoApiKey = process.env.EVOLUTION_API_KEY || '';
        const chatwootAdminToken = process.env.CHATWOOT_ADMIN_TOKEN || '';
        const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || 'http://chatai.sajur.com.br:3002';

        try {
            const namespacedName = instanceConfig?.evolutionInstanceName || instanceName;
            await fetch(`${evoUrl}/instance/delete/${namespacedName}`, {
                method: 'DELETE',
                headers: { 'apikey': evoApiKey }
            });
            // We ignore errors here (e.g. 404) because the instance might already be deleted or not exist
        } catch (e) {
            console.warn(`Failed to delete underlying Evolution instance for chatwoot ${instanceName}:`, e);
        }

        if (chatwootAdminToken && instanceConfig?.accountId && instanceConfig?.inboxId) {
            try {
                // Delete the Chatwoot Inbox carefully to free up the Phone Number
                await fetch(`${chatwootBaseUrl}/api/v1/accounts/${instanceConfig.accountId}/inboxes/${instanceConfig.inboxId}`, {
                    method: 'DELETE',
                    headers: { 'api_access_token': chatwootAdminToken }
                });
            } catch (e) {
                console.warn(`Failed to delete underlying Chatwoot Inbox ${instanceConfig.inboxId}:`, e);
            }
        }
    }
    // ----------------------------------

    // 2. Remove from Firestore (try both collections for backward compat)
    try {
        // Try new collection first
        try {
            const newDocRef = doc(db, 'messagingInstances', docId);
            const docSnap = await getDoc(newDocRef);
            if (docSnap.exists()) {
                await deleteDoc(newDocRef);
                return { success: true, message: 'Instância removida com sucesso.' };
            }
        } catch { /* ignore, try legacy */ }

        // Try legacy collection
        const legacyDocRef = doc(db, 'evolutionInstances', docId);
        await deleteDoc(legacyDocRef);
        return { success: true, message: 'Instância removida com sucesso.' };
    } catch (error: any) {
        console.error('Error deleting instance from Firestore:', error);
        return { success: false, message: 'A instância foi removida da API, mas falhou ao ser removida do nosso sistema.' };
    }
}

// Backward-compat alias
export const deleteEvolutionInstance = (instanceName: string, docId: string) =>
    deleteMessagingInstance(instanceName, docId, 'evolution');


/**
 * Test provider connection before creating an instance.
 * Makes a lightweight healthcheck call to validate credentials.
 */
export async function testProviderConnection(
    provider: ProviderType,
    config: Record<string, string>
): Promise<{ success: boolean; message: string }> {
    'use server';

    try {
        switch (provider) {
            case 'zapi': {
                const baseUrl = config.baseUrl || process.env.ZAPI_BASE_URL || 'https://api.z-api.io/instances';
                const instanceId = config.instanceId || process.env.ZAPI_INSTANCE_ID || '';
                const token = config.token || process.env.ZAPI_TOKEN || '';
                const clientToken = config.clientToken || process.env.ZAPI_CLIENT_TOKEN || '';
                const headers = { 'Client-Token': clientToken, 'Content-Type': 'application/json' };

                if (!instanceId || !token || !clientToken) {
                    return { success: false, message: '❌ Preencha Instance ID, Token e Client Token.' };
                }

                // Try /me endpoint first (validates credentials without requiring WhatsApp connected)
                const meUrl = `${baseUrl}/${instanceId}/token/${token}/me`;
                const meRes = await fetch(meUrl, { method: 'GET', headers, cache: 'no-store' });

                if (meRes.ok) {
                    return { success: true, message: '✅ Credenciais válidas! Instância Z-API autenticada com sucesso.' };
                }

                // Fall back to /status — a 400 from this endpoint usually means
                // credentials are correct but WhatsApp is not yet connected
                const statusUrl = `${baseUrl}/${instanceId}/token/${token}/status`;
                const statusRes = await fetch(statusUrl, { method: 'GET', headers, cache: 'no-store' });

                if (statusRes.ok) {
                    const data = await statusRes.json();
                    const connected = data?.connected || data?.status === 'connected';
                    return {
                        success: true,
                        message: connected
                            ? '✅ Conexão validada! Instância Z-API conectada ao WhatsApp.'
                            : '⚠️ Credenciais válidas, mas a instância não está conectada ao WhatsApp. Conecte pelo painel Z-API.',
                    };
                }

                // Both endpoints failed — try to understand the error
                if (statusRes.status === 400 || statusRes.status === 404) {
                    // 400/404 with valid Client-Token usually means disconnected, not invalid creds
                    return {
                        success: true,
                        message: '⚠️ Credenciais aceitas, mas instância sem WhatsApp conectado. Acesse app.z-api.io para conectar.',
                    };
                }

                const errText = await statusRes.text().catch(() => '');
                return { success: false, message: `❌ Falha na autenticação (HTTP ${statusRes.status}). Verifique Instance ID, Token e Client Token. ${errText}` };
            }

            case 'chatwoot': {
                const baseUrl = config.baseUrl?.replace(/\/$/, '');
                if (!baseUrl) return { success: false, message: '❌ URL do servidor Chatwoot é obrigatória.' };
                const res = await fetch(`${baseUrl}/auth/sign_in`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api_access_token': config.apiAccessToken || '',
                    },
                    body: JSON.stringify({}),
                    cache: 'no-store',
                });
                // Chatwoot profile endpoint with valid token
                const profileRes = await fetch(`${baseUrl}/api/v1/profile`, {
                    method: 'GET',
                    headers: { 'api_access_token': config.apiAccessToken || '' },
                    cache: 'no-store',
                });
                if (!profileRes.ok) {
                    return { success: false, message: `❌ Falha na conexão (HTTP ${profileRes.status}). Verifique a URL e o Access Token.` };
                }

                // Validate Inbox ID if provided
                if (config.accountId && config.inboxId) {
                    try {
                        const inboxesRes = await fetch(`${baseUrl}/api/v1/accounts/${config.accountId}/inboxes`, {
                            method: 'GET',
                            headers: { 'api_access_token': config.apiAccessToken || '' },
                            cache: 'no-store',
                        });
                        if (inboxesRes.ok) {
                            const inboxesData = await inboxesRes.json();
                            const inboxExists = inboxesData.payload?.some((ibx: any) => String(ibx.id) === String(config.inboxId));
                            if (!inboxExists) {
                                return { success: false, message: `❌ O Inbox ID ${config.inboxId} não foi encontrado na conta ${config.accountId}. Verifique se o ID está correto (tente ID 2).` };
                            }
                        } else {
                            return { success: false, message: `❌ Falha ao verificar Inboxes (HTTP ${inboxesRes.status}). Verifique o Account ID.` };
                        }
                    } catch (e: any) {
                        return { success: false, message: `❌ Erro ao validar Inbox ID: ${e.message}` };
                    }
                }

                return { success: true, message: '✅ Conexão validada! Servidor Chatwoot e Inbox confirmados.' };
            }

            case 'evolution': {
                const evoUrl = config.apiUrl || process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolutionapi.dbltecnologia.com.br';
                const evoApiKey = config.apiKey || process.env.EVOLUTION_API_KEY || '';
                const res = await fetch(`${evoUrl}/instance/fetchInstances`, {
                    method: 'GET',
                    headers: { 'apikey': evoApiKey },
                    cache: 'no-store',
                });
                if (res.ok) {
                    return { success: true, message: '✅ Conexão com Evolution API validada!' };
                }
                return { success: false, message: `❌ Falha na conexão com Evolution API (HTTP ${res.status}).` };
            }

            default:
                return { success: false, message: `Provider desconhecido: ${provider}` };
        }
    } catch (error: any) {
        return { success: false, message: `❌ Erro de rede: ${error.message}` };
    }
}

export async function getInstanceConnectionState(
    instanceName: string,
    provider: ProviderType = 'evolution',
    instanceConfig?: Record<string, any>
): Promise<{ success: boolean; data?: any; message: string }> {
    'use server';

    const messagingProvider = getProvider(provider);

    if (!messagingProvider.getConnectionState) {
        return { success: true, data: { state: 'open' }, message: 'Provider does not support connection state.' };
    }

    try {
        const config = buildProviderConfig(provider, instanceName, instanceConfig);
        // For Chatwoot, we want to fetch the real connection state from the inbox (polling qr_data_url)
        if (provider === 'chatwoot') {
            const chatwootConfig = config as any;
            if (!chatwootConfig.baseUrl || !chatwootConfig.apiAccessToken || !chatwootConfig.accountId || !chatwootConfig.inboxId) {
                return { success: false, message: 'Dados de integração Chatwoot ausentes no Firestore.' };
            }

            const inboxRes = await fetch(`${chatwootConfig.baseUrl}/api/v1/accounts/${chatwootConfig.accountId}/inboxes/${chatwootConfig.inboxId}`, {
                method: 'GET',
                headers: { 'api_access_token': chatwootConfig.apiAccessToken },
                cache: 'no-store',
            });

            if (inboxRes.ok) {
                const inboxData = await inboxRes.json();
                const providerConn = inboxData.provider_connection || {};
                
                // Unify logic specifies state connecting/open/close, mapped from provider_connection
                const connState = providerConn.connection || 'disconnected';
                const qrBase64 = providerConn.qr_data_url || null;

                // Ensure qrDataUrl is properly formatted as base64 for the Image component
                // Some instances omit 'data:image/png;base64,'
                let formattedQr = qrBase64;
                if (qrBase64 && !qrBase64.startsWith('data:image')) {
                     formattedQr = `data:image/png;base64,${qrBase64}`;
                }

                // Fallback: Se o Webhook do Baileys der timeout e parar num dead-end sem gerar o QR Code (como closed/disconnected)
                // Disparamos o `setup_channel_provider` de novo. 
                // NUNCA disparar se estiver 'connecting', senao reiniciaremos o worker do Chatwoot infinitamente via backend polling.
                if (!formattedQr && (connState === 'disconnected' || connState === 'close')) {
                    try {
                        await fetch(`${chatwootConfig.baseUrl}/api/v1/accounts/${chatwootConfig.accountId}/inboxes/${chatwootConfig.inboxId}/setup_channel_provider`, {
                            method: 'POST',
                            headers: { 'api_access_token': chatwootConfig.apiAccessToken },
                            cache: 'no-store'
                        });
                    } catch (e: any) {
                        console.log(`Fallback setup trigger failed: ${e.message}`);
                    }
                }

                return { 
                    success: true, 
                    data: { 
                        state: connState,
                        base64: formattedQr 
                    }, 
                    message: 'Estado puxado diretamente da Inbox do Chatwoot Fazer-AI.' 
                };
            }
            // fallback if it fails
            return { success: true, data: { state: 'disconnected' }, message: 'Servidor Chatwoot offline no momento ou Instance Name invalida.' };
        }

        const state = await messagingProvider.getConnectionState(config);

        // For Evolution, also include raw data for QR code modal compat
        if (provider === 'evolution') {
            const evoUrl = (instanceConfig as any)?.apiUrl || process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolutionapi.dbltecnologia.com.br';
            const evoApiKey = (instanceConfig as any)?.apiKey || process.env.EVOLUTION_API_KEY || '';

            const response = await fetch(`${evoUrl}/instance/connect/${instanceName}`, {
                method: 'GET',
                headers: { 'apikey': evoApiKey },
                cache: 'no-store',
            });

            const data = await response.json();
            return { success: response.ok, data, message: 'Estado da instância obtido.' };
        }

        return { success: true, data: { state: state.state }, message: 'Estado da instância obtido.' };
    } catch (error: any) {
        console.error(`Erro ao obter estado da instância ${instanceName}:`, error);
        return { success: false, message: error.message };
    }
}

/**
 * Chatwoot SSO Login Generator
 * Creates a magic link so a user can jump straight into their agent interface
 * without entering the auto-generated password.
 */
export async function getChatwootSsoUrl(instanceId: string, userId: string): Promise<{ success: boolean; url?: string; message: string }> {
    'use server';

    if (!instanceId || !userId) return { success: false, message: 'ID da Instância ou Usuário inválido.' };

    try {
        const docRef = doc(db, 'messagingInstances', instanceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, message: 'Instância não encontrada.' };
        }

        const data = docSnap.data() as MessagingInstance;
        if (data.ownerId !== userId) {
            return { success: false, message: 'Sem permissão para acessar esta instância.' };
        }

        if (data.provider !== 'chatwoot' || !data.config?.apiAccessToken || !data.config?.baseUrl) {
            return { success: false, message: 'Instância inválida ou credenciais ausentes.' };
        }

        // We can just redirect to the app root, passing the access_token in the querystring 
        // to bypass the login screen if Chatwoot is configured for JWT/token login,
        // OR we can make a backend call to Chatwoot's API to construct a proper SSO URL.
        // According to Chatwoot API Docs, for users logging into the dashboard:
        const ssoUrl = `${data.config.baseUrl}/app/login?email=${encodeURIComponent('admin-' + data.config.accountId + '@' + data.name.replace(/\s/g, '').toLowerCase() + '.local')}`;

        // However, a true Magic Link requires generating a token via the Devise Auth API or using the SDK.
        // For a robust implementation without sharing the password, let's just send them to the Dashboard 
        // using the Auth headers, or since it's an iframe/new tab, Chatwoot supports SSO if configured.

        // In the absence of a dedicated MagicLink endpoint for Administrators in open-source Chatwoot,
        // we can authenticate via the `/auth/sign_in` using the JWT if we had it, but `api_access_token` is sufficient for API calls.
        // Let's return the URL with the token hash so the frontend can theoretically do an auto-login via script, 
        // OR just pass the user directly to their account ID:

        const loginRedirect = `${data.config.baseUrl}/app/accounts/${data.config.accountId}/dashboard`;

        return {
            success: true,
            url: loginRedirect,
            // NOTE: A true SSO flow into the Dashboard without a password requires "Chatwoot SSO Authentication" 
            // set up via environment variables on the Chatwoot Server, which generates a JWT using SECRET_KEY.
            // Assuming this is configured, you'd generate the JWT here. For MVP, we pass the URL.
            message: 'URL obtida com sucesso.'
        };

    } catch (error: any) {
        console.error("Erro ao gerar SSO URL do Chatwoot:", error);
        return { success: false, message: error.message };
    }
}


// ++ API Key Management ++
export type ApiKey = {
    id: string;
    name: string;
    prefix: string;
    createdAt: { seconds: number, nanoseconds: number };
    type?: 'external' | 'whatsapp';
}

export async function generateApiKey(userId: string, keyName: string, type: 'external' | 'whatsapp'): Promise<{ fullKey: string; id: string }> {
    if (!userId || !keyName) {
        throw new Error("User ID and key name are required.");
    }

    const fullKey = `sk_${randomBytes(24).toString('hex')}`; // 48 chars + prefix
    const prefix = fullKey.substring(0, 8); // e.g., sk_...
    const hashedKey = createHash('sha256').update(fullKey).digest('hex');

    const keysCollection = collection(db, 'users', userId, 'api_keys');

    const docRef = await addDoc(keysCollection, {
        name: keyName,
        prefix: prefix,
        hashedKey: hashedKey,
        createdAt: serverTimestamp(),
        lastUsed: null,
        type: type,
    });

    return { fullKey, id: docRef.id };
}


export async function getApiKeys(userId: string): Promise<ApiKey[]> {
    if (!userId) return [];

    const keysCollection = collection(db, 'users', userId, 'api_keys');
    const q = query(keysCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const { fullKey, ...clientData } = data;
        return convertTimestamps({
            id: doc.id,
            ...clientData
        })
    }) as ApiKey[];
}

export async function deleteApiKey(keyId: string, userId: string): Promise<void> {
    if (!userId || !keyId) throw new Error("User ID and Key ID are required.");

    const keyDocRef = doc(db, 'users', userId, 'api_keys', keyId);
    await deleteDoc(keyDocRef);
}

export async function setFunnelApiKey(funnelId: string, apiKeyId: string): Promise<{ success: boolean }> {
    if (!funnelId || !apiKeyId) {
        throw new Error("Funnel ID and API Key ID are required.");
    }

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        await updateDoc(funnelDocRef, {
            whatsappApiKeyId: apiKeyId
        });
        return { success: true };
    } catch (error) {
        console.error('Error setting funnel API key:', error);
        throw new Error("Failed to associate API key with the funnel.");
    }
}


// ++ Funnel, Lead, Company, and Contact Management ++

export async function getCompanies(uploadId: string): Promise<Company[]> {
    if (!uploadId) return [];
    const companiesRef = collection(db, 'uploads', uploadId, 'companies');
    const snapshot = await getDocs(query(companiesRef, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
}

export async function addCompany(uploadId: string, companyData: Omit<Company, 'id'>): Promise<Company> {
    if (!uploadId) throw new Error("Funnel ID is required.");
    const companiesRef = collection(db, 'uploads', uploadId, 'companies');
    const docRef = await addDoc(companiesRef, { ...companyData, createdAt: serverTimestamp() });
    return { id: docRef.id, ...companyData };
}

export async function getContacts(uploadId: string): Promise<Contact[]> {
    if (!uploadId) return [];
    const contactsRef = collection(db, 'uploads', uploadId, 'contacts');
    const snapshot = await getDocs(query(contactsRef, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}

export async function addContact(uploadId: string, contactData: Omit<Contact, 'id'>): Promise<Contact> {
    if (!uploadId) throw new Error("Funnel ID is required.");
    const contactsRef = collection(db, 'uploads', uploadId, 'contacts');
    const docRef = await addDoc(contactsRef, { ...contactData, createdAt: serverTimestamp() });
    return { id: docRef.id, ...contactData };
}

export async function saveFunnelPrompt(funnelId: string, prompt: string): Promise<{ success: boolean }> {
    if (!funnelId) {
        throw new Error('Funnel ID is required to save the prompt.');
    }
    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        await updateDoc(funnelDocRef, {
            customPrompt: prompt,
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving funnel prompt:', error);
        throw new Error('Failed to save custom prompt to Firestore.');
    }
}


export async function revertLeadsWithoutPlan(funnelId: string): Promise<{ success: boolean; count: number }> {
    if (!funnelId) {
        throw new Error("ID do Funil é obrigatório.");
    }

    try {
        const batch = writeBatch(db);
        let correctedCount = 0;

        const plans = await getOutreachPlans(funnelId);
        const leadsWithPlan = new Set<string>();
        if (plans.data) {
            plans.data.forEach((plan: any) => {
                if (plan.planData && Array.isArray(plan.planData)) {
                    plan.planData.forEach((item: any) => {
                        if (item.leadId) {
                            leadsWithPlan.add(item.leadId);
                        }
                    });
                }
            });
        }

        const recordsRef = collection(db, 'uploads', funnelId, 'records');
        const q = query(recordsRef, where('statusFunil', '==', 'Em Pesquisa'));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(recordDoc => {
            if (!leadsWithPlan.has(recordDoc.id)) {
                batch.update(recordDoc.ref, { statusFunil: 'Novo' });
                correctedCount++;
            }
        });

        if (correctedCount > 0) {
            await batch.commit();
        }

        return { success: true, count: correctedCount };
    } catch (error) {
        console.error("Error reverting leads without plan:", error);
        throw new Error("Falha ao corrigir status dos leads.");
    }
}

export async function deleteFunnel(funnelId: string): Promise<{ success: boolean }> {
    if (!funnelId) {
        throw new Error("Funnel ID is required to delete.");
    }

    const BATCH_SIZE = 499;

    try {
        const documentsToDelete: any[] = [];

        const subcollections = ['records', 'companies', 'contacts', 'outreachPlans', 'logs'];
        for (const sub of subcollections) {
            const subRef = collection(db, 'uploads', funnelId, sub);
            const snapshot = await getDocs(subRef);
            for (const doc of snapshot.docs) {
                documentsToDelete.push(doc.ref);
                if (sub === 'records') {
                    const interacoesRef = collection(doc.ref, 'interacoes');
                    const interacoesSnapshot = await getDocs(interacoesRef);
                    interacoesSnapshot.forEach(interactionDoc => documentsToDelete.push(interactionDoc.ref));
                }
            }
        }

        const funnelDocRef = doc(db, 'uploads', funnelId);
        documentsToDelete.push(funnelDocRef);

        for (let i = 0; i < documentsToDelete.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = documentsToDelete.slice(i, i + BATCH_SIZE);
            chunk.forEach(docRef => batch.delete(docRef));
            await batch.commit();
        }

        return { success: true };

    } catch (error) {
        console.error("Error deleting funnel:", error);
        throw new Error("Failed to delete funnel from Firestore.");
    }
}

export async function renameFunnel(funnelId: string, newName: string) {
    if (!funnelId) throw new Error("Funnel ID is required");
    if (!newName || !newName.trim()) throw new Error("New name is required");

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        await updateDoc(funnelDocRef, {
            fileName: newName.trim(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error renaming funnel:", error);
        throw new Error("Failed to rename funnel in Firestore.");
    }
}

export async function addLeadToFunnel(uploadId: string, leadData: any) {
    if (!uploadId) throw new Error("Upload ID is required");
    if (!leadData) throw new Error("Lead data is required");

    try {
        const recordsCollectionRef = collection(db, 'uploads', uploadId, 'records');
        const newDocRef = await addDoc(recordsCollectionRef, {
            ...leadData,
            createdAt: serverTimestamp(),
        });

        const newDocSnap = await getDoc(newDocRef);
        if (!newDocSnap.exists()) {
            throw new Error("Failed to retrieve the new lead after creation.");
        }

        const createdLead = convertTimestamps({
            id: newDocSnap.id,
            uploadId: uploadId,
            ...newDocSnap.data()
        });

        const uploadDocRef = doc(db, 'uploads', uploadId);
        await updateDoc(uploadDocRef, { recordCount: increment(1) });

        return createdLead;

    } catch (error) {
        console.error("Error adding lead to funnel:", error);
        throw new Error("Failed to add new lead to the funnel.");
    }
}


export async function updateFunnelStages(uploadId: string, newStages: string[]) {
    if (!uploadId) {
        throw new Error("Upload ID is required");
    }
    if (!newStages || !Array.isArray(newStages)) {
        throw new Error("New stages must be an array");
    }

    try {
        const uploadDocRef = doc(db, 'uploads', uploadId);
        await updateDoc(uploadDocRef, {
            stages: newStages,
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating funnel stages:', error);
        throw new Error("Failed to update funnel stages in Firestore.");
    }
}

export async function getFunnels(ownerId: string) {
    if (!ownerId) {
        throw new Error('ownerId is required to fetch funnels.');
    }
    try {
        const uploadsRef = collection(db, 'uploads');
        const dataQuery = query(uploadsRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(dataQuery);
        const total = querySnapshot.size;

        const funnels = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.fileName || `Funil sem nome (${doc.id.substring(0, 5)})`,
                ownerId: data.ownerId,
                recordCount: data.recordCount || 0,
                whatsappApiKeyId: data.whatsappApiKeyId || null,
                evolutionInstanceName: data.evolutionInstanceName || null,
            };
        });

        return {
            data: funnels,
            total,
        };
    } catch (error) {
        console.error('Error fetching funnels:', error);
        throw new Error('Failed to fetch funnels.');
    }
}


export async function createFunnel(funnelName: string, ownerId: string, ownerEmail: string): Promise<{ id: string, name: string }> {
    if (!funnelName || !ownerId || !ownerEmail) {
        throw new Error('Funnel name, owner ID, and owner email are required to create a funnel.');
    }
    try {
        const uploadDocRef = await addDoc(collection(db, "uploads"), {
            fileName: funnelName,
            createdAt: serverTimestamp(),
            recordCount: 0,
            ownerId: ownerId,
            ownerEmail: ownerEmail,
            isEmpty: true,
            stages: defaultFunnelStages,
            campaignStatus: 'stopped',
            campaignStats: { sent: 0, failed: 0 }
        });

        return { id: uploadDocRef.id, name: funnelName };
    } catch (error) {
        console.error("Error creating new funnel in Firestore: ", error);
        throw new Error("Could not create new funnel.");
    }
}

export async function getDashboardData(
    uploadId: string,
    ownerId: string,
    role: 'admin' | 'cliente' = 'cliente'
) {
    if (!uploadId) {
        throw new Error('Upload ID is required');
    }

    try {
        const uploadDocRef = doc(db, 'uploads', uploadId);
        const uploadDocSnap = await getDoc(uploadDocRef);

        if (!uploadDocSnap.exists()) {
            throw new Error("Upload batch not found.");
        }

        const funnelData = uploadDocSnap.data();

        if (role !== 'admin' && funnelData.ownerId !== ownerId) {
            console.warn(`Permission denied: User ${ownerId} attempting to access upload ${uploadId} owned by ${funnelData.ownerId}`);
            return {
                leads: { data: [], total: 0 },
                funnelName: null,
                stages: [],
                customPrompt: null,
                ownerId: null,
                campaignStatus: null,
                evolutionInstanceName: null,
                messagingInstanceName: null,
                messagingProvider: null,
                campaignStats: { sent: 0, failed: 0 },
            };
        }

        const recordsRef = collection(db, 'uploads', uploadId, 'records');
        const recordsSnapshot = await getDocs(recordsRef);
        const total = recordsSnapshot.size;

        const allLeads: any[] = [];
        recordsSnapshot.forEach((doc) => {
            const plainData = convertTimestamps({ id: doc.id, ...doc.data() });
            allLeads.push(plainData);
        });

        return {
            leads: { data: allLeads, total },
            funnelName: funnelData.fileName || 'Funil Principal',
            stages: funnelData.stages || defaultFunnelStages,
            customPrompt: funnelData.customPrompt || null,
            ownerId: funnelData.ownerId,
            campaignStatus: funnelData.campaignStatus || 'stopped',
            evolutionInstanceName: funnelData.evolutionInstanceName || null,
            messagingInstanceName: funnelData.messagingInstanceName || null,
            messagingProvider: funnelData.messagingProvider || null,
            campaignStats: funnelData.campaignStats || { sent: 0, failed: 0 },
        };

    } catch (error) {
        console.error('Error fetching dashboard data from server action:', error);
        throw new Error('Failed to fetch data from Firestore.');
    }
}

export async function getAllFunnelsData(ownerId: string) {
    if (!ownerId) {
        throw new Error('Owner ID is required.');
    }

    try {
        const userFunnels = await getFunnels(ownerId);

        let allLeads: any[] = [];
        let totalCount = 0;

        for (const funnel of userFunnels.data) {
            totalCount += funnel.recordCount;
            const recordsRef = collection(db, 'uploads', funnel.id, 'records');
            const recordsSnapshot = await getDocs(recordsRef);
            recordsSnapshot.forEach(doc => {
                allLeads.push(convertTimestamps({ id: doc.id, ...doc.data() }));
            });
        }

        return {
            leads: { data: allLeads, total: totalCount },
        };

    } catch (error) {
        console.error('Error fetching all funnels data:', error);
        throw new Error('Failed to fetch data for all funnels.');
    }
}


export async function saveOutreachPlan(uploadId: string, plan: any) {
    if (!uploadId) {
        throw new Error('Upload ID is required');
    }
    if (!plan || plan.length === 0) {
        throw new Error('Plan data is required');
    }

    try {
        const enrichedPlanData = plan.map((item: any) => ({
            ...item,
            status: 'Pendente',
            agentNotes: ''
        }));

        const planCollectionRef = collection(db, 'uploads', uploadId, 'outreachPlans');
        await addDoc(planCollectionRef, {
            createdAt: serverTimestamp(),
            planData: enrichedPlanData
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving outreach plan:', error);
        throw new Error('Failed to save outreach plan to Firestore.');
    }
}

export async function getOutreachPlans(uploadId: string, page: number = 1, pageSize: number = 10) {
    if (!uploadId) {
        throw new Error('Upload ID is required');
    }
    try {
        const plansRef = collection(db, 'uploads', uploadId, 'outreachPlans');
        const q = query(plansRef, orderBy('createdAt', 'desc'));

        const totalSnapshot = await getDocs(q);
        const total = totalSnapshot.size;

        const paginatedQuery = query(q, limit(pageSize));
        const querySnapshot = await getDocs(paginatedQuery);

        const allPlans = querySnapshot.docs.map(doc =>
            convertTimestamps({ id: doc.id, ...doc.data() })
        );

        return { data: allPlans, total, page, pageSize };

    } catch (error) {
        console.error('Error fetching outreach plans:', error);
        throw new Error('Failed to fetch outreach plans from Firestore.');
    }
}


export async function updateOutreachPlanItem(uploadId: string, planId: string, updatedItem: any) {
    if (!uploadId || !planId || !updatedItem || !updatedItem.leadId) {
        throw new Error('Missing required parameters for update.');
    }

    try {
        const planDocRef = doc(db, 'uploads', uploadId, 'outreachPlans', planId);
        const planDocSnap = await getDoc(planDocRef);

        if (!planDocSnap.exists()) {
            throw new Error("Plan document not found.");
        }

        const planData = planDocSnap.data();
        const items = planData.planData || [];

        const itemIndex = items.findIndex((item: any) => item.leadId === updatedItem.leadId);

        if (itemIndex > -1) {
            const itemToSave = { ...items[itemIndex], ...updatedItem };
            // Remove injected planId wrapper variable that shouldn't be persisted to Firestore
            if (itemToSave.planId) {
                delete itemToSave.planId;
            }
            items[itemIndex] = itemToSave;

            const batch = writeBatch(db);

            batch.update(planDocRef, { planData: items });

            if (updatedItem.status === 'Contatado') {
                const leadDocRef = doc(db, 'uploads', uploadId, 'records', updatedItem.leadId);
                batch.update(leadDocRef, { statusFunil: 'Primeiro Contato' });
            }

            await batch.commit();

        } else {
            console.warn(`Lead item with ID ${updatedItem.leadId} not found in plan ${planId}. Skipping update.`);
        }

        return { success: true };

    } catch (error: any) {
        console.error('Error updating plan item:', error);
        throw new Error(`Failed to update plan item in Firestore: ${error?.message || 'Unknown'}`);
    }
}

interface UpdateLeadsStatusOptions {
    getInteractionNote?: (leadId: string) => string;
}

export async function updateLeadsStatus(
    uploadId: string,
    leadIds: string[],
    newStatus: string,
    options?: UpdateLeadsStatusOptions
) {
    if (!uploadId || !leadIds || leadIds.length === 0 || !newStatus) {
        throw new Error('Missing required parameters for updating lead statuses.');
    }

    try {
        const batch = writeBatch(db);

        for (const leadId of leadIds) {
            const leadDocRef = doc(db, 'uploads', uploadId, 'records', leadId);
            batch.update(leadDocRef, { statusFunil: newStatus });

            const note = options?.getInteractionNote
                ? options.getInteractionNote(leadId)
                : `Status alterado para "${newStatus}".`;

            const historyRef = doc(collection(leadDocRef, 'interacoes'));
            batch.set(historyRef, {
                tipoInteracao: 'Mudança de Status (em lote)',
                resumoInteracao: note,
                dataInteracao: serverTimestamp(),
                userId: 'system',
                userName: 'Sistema (Ação em Lote)'
            });
        }

        await batch.commit();
        return { success: true, count: leadIds.length };

    } catch (error) {
        console.error('Error updating lead statuses:', error);
        throw new Error('Failed to update lead statuses in Firestore.');
    }
}


export async function addInteractionToLead(
    uploadId: string,
    leadId: string,
    interactionData: { tipoInteracao: string; resumoInteracao: string, userId?: string, userName?: string }
) {
    if (!uploadId || !leadId || !interactionData) {
        throw new Error("Upload ID, Lead ID, and interaction data are required.");
    }

    try {
        const interactionsRef = collection(db, 'uploads', uploadId, 'records', leadId, 'interacoes');
        const newDocRef = await addDoc(interactionsRef, {
            ...interactionData,
            dataInteracao: serverTimestamp()
        });

        return { success: true, interactionId: newDocRef.id };
    } catch (error) {
        console.error("Error adding interaction to lead:", error);
        throw new Error("Failed to add interaction to Firestore.");
    }
}

async function deletePlansByStatus(uploadId: string, status: string | null): Promise<{ success: boolean; count: number }> {
    if (!uploadId) {
        throw new Error("Upload ID is required.");
    }
    try {
        const plansRef = collection(db, "uploads", uploadId, "outreachPlans");
        const plansSnapshot = await getDocs(plansRef);

        if (plansSnapshot.empty) {
            return { success: true, count: 0 };
        }

        const batch = writeBatch(db);
        let itemsRemovedCount = 0;

        for (const planDoc of plansSnapshot.docs) {
            const planData = planDoc.data().planData;
            if (!Array.isArray(planData)) continue;

            const leadsToRevert = new Set<string>();
            const remainingItems = planData.filter(item => {
                const matchesStatus = status === null || item.status === status;
                if (matchesStatus) {
                    leadsToRevert.add(item.leadId);
                    itemsRemovedCount++;
                    return false;
                }
                return true;
            });

            for (const leadId of leadsToRevert) {
                const leadRef = doc(db, "uploads", uploadId, "records", leadId);
                const leadSnap = await getDoc(leadRef);
                if (leadSnap.exists()) batch.update(leadRef, { statusFunil: 'Novo' });
            }

            if (remainingItems.length === 0) {
                batch.delete(planDoc.ref);
            } else if (remainingItems.length < planData.length) {
                batch.update(planDoc.ref, { planData: remainingItems });
            }
        }

        await batch.commit();
        return { success: true, count: itemsRemovedCount };

    } catch (error) {
        console.error(`Error deleting plans by status ${status}:`, error);
        throw new Error(`Failed to delete plans for status: ${status}.`);
    }
}

export async function deleteAllOutreachPlans(uploadId: string): Promise<{ success: boolean }> {
    const result = await deletePlansByStatus(uploadId, null);
    return { success: result.success };
}

export async function deleteOutreachPlansByStatus(uploadId: string, status: string): Promise<{ success: boolean; count: number }> {
    return await deletePlansByStatus(uploadId, status);
}

export async function searchLeads(
    ownerId: string | null,
    role: 'admin' | 'cliente' = 'cliente',
    searchParams: { phone?: string; email?: string; name?: string }
) {
    if (!searchParams.phone && !searchParams.email && !searchParams.name) {
        throw new Error("At least one search parameter (phone, email, or name) is required.");
    }

    try {
        let q = query(collectionGroup(db, 'records'));

        if (searchParams.phone) {
            q = query(q, where('phone', '==', searchParams.phone));
        }
        if (searchParams.email) {
            q = query(q, where('email', '==', searchParams.email));
        }
        if (searchParams.name) {
            q = query(q, where('name', '==', searchParams.name));
        }

        const querySnapshot = await getDocs(q);

        let leads = querySnapshot.docs.map(doc => convertTimestamps({
            id: doc.id,
            funnelId: doc.ref.parent.parent?.id,
            ...doc.data()
        }));

        if (role !== 'admin' && ownerId) {
            const userFunnelsSnapshot = await getDocs(query(collection(db, 'uploads'), where('ownerId', '==', ownerId)));
            const userFunnelIds = new Set(userFunnelsSnapshot.docs.map(doc => doc.id));
            leads = leads.filter(lead => userFunnelIds.has(lead.funnelId));
        }

        return { data: leads, total: leads.length };

    } catch (error) {
        console.error("Error searching leads:", error);
        throw new Error("Failed to search leads in Firestore.");
    }
}

export async function getQualifiableLeads(funnelId: string, userId: string) {
    if (!funnelId || !userId) {
        throw new Error("Funnel ID and User ID are required.");
    }
    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        const funnelDocSnap = await getDoc(funnelDocRef);

        if (!funnelDocSnap.exists() || funnelDocSnap.data().ownerId !== userId) {
            throw new Error("Funnel not found or access denied.");
        }

        const recordsRef = collection(db, 'uploads', funnelId, 'records');
        const q = query(recordsRef, where('statusFunil', '==', 'Novo'));

        const querySnapshot = await getDocs(q);
        const leads = querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));

        return leads;
    } catch (error) {
        console.error("Error fetching qualifiable leads:", error);
        throw new Error("Failed to fetch qualifiable leads.");
    }
}

export async function getLeadsWithRecentOutreach(funnelId: string, days: number): Promise<Set<string>> {
    if (!funnelId) {
        throw new Error("Funnel ID is required.");
    }
    const recentlyContacted = new Set<string>();
    const cutoffDate = subDays(new Date(), days);

    const interactionsQuery = query(
        collectionGroup(db, 'interacoes'),
        where('dataInteracao', '>=', cutoffDate)
    );
    const interactionsSnapshot = await getDocs(interactionsQuery);
    for (const interactionDoc of interactionsSnapshot.docs) {
        if (interactionDoc.ref.parent.parent?.parent?.id === 'uploads' && interactionDoc.ref.parent.parent.id === funnelId) {
            const leadId = interactionDoc.ref.parent.id;
            recentlyContacted.add(leadId);
        }
    }

    const plansQuery = query(
        collection(db, 'uploads', funnelId, 'outreachPlans'),
        where('createdAt', '>=', cutoffDate)
    );
    const plansSnapshot = await getDocs(plansQuery);
    plansSnapshot.forEach(planDoc => {
        const planData = planDoc.data().planData;
        if (Array.isArray(planData)) {
            planData.forEach(item => {
                if (item.leadId) recentlyContacted.add(item.leadId);
            });
        }
    });

    return recentlyContacted;
}

export async function fetchLeadsFromFunnel(funnelId: string): Promise<any[]> {
    const recordsRef = collection(db, 'uploads', funnelId, 'records');
    const querySnapshot = await getDocs(recordsRef);
    const leads: any[] = [];
    querySnapshot.forEach(doc => {
        leads.push({
            id: doc.id,
            uploadId: funnelId,
            ...doc.data()
        });
    });
    return leads;
}


// ++ Analysis Reports ++

export async function createAnalysisReport(userId: string): Promise<string> {
    if (!userId) {
        throw new Error("User ID is required to create an analysis report.");
    }

    try {
        const reportsCollectionRef = collection(db, 'users', userId, 'analysisReports');
        const reportDoc = await addDoc(reportsCollectionRef, {
            createdAt: serverTimestamp(),
            status: 'Running',
            summary: {},
            details: [],
            error: null,
        });
        return reportDoc.id;
    } catch (e) {
        console.error("FATAL: Could not create analysis report in Firestore.", e);
        throw new Error("Failed to create analysis report entry.");
    }
}

export async function updateAnalysisReport(
    userId: string,
    reportId: string,
    summary: { funnelsProcessed: number, totalIgnored: number, totalCreated: number },
    details: any[],
    status: 'Completed' | 'Failed' | 'Running',
    error?: string
) {
    if (!userId || !reportId) {
        throw new Error("User ID and Report ID are required to update an analysis report.");
    }

    try {
        const reportDocRef = doc(db, 'users', userId, 'analysisReports', reportId);
        await updateDoc(reportDocRef, {
            summary,
            details,
            status,
            error: error || null,
        });
    } catch (e) {
        console.error("FATAL: Could not update analysis report in Firestore.", e);
    }
}


export async function getAnalysisReports(userId: string) {
    if (!userId) {
        throw new Error("User ID is required to fetch analysis reports.");
    }
    try {
        const reportsRef = collection(db, 'users', userId, 'analysisReports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc =>
            convertTimestamps({ id: doc.id, ...doc.data() })
        );
    } catch (error) {
        console.error("Error fetching analysis reports:", error);
        throw new Error("Failed to fetch analysis reports.");
    }
}

export async function saveAnalysisReport(
    userId: string,
    summary: { funnelsProcessed: number, totalIgnored: number, totalCreated: number },
    details: any[],
    error?: string
) {
    const reportId = await createAnalysisReport(userId);
    await updateAnalysisReport(userId, reportId, summary, details, error ? 'Failed' : 'Completed', error);
}

// ++ Campaign Actions (INTERNAL WORKER) ++

export async function updateFunnelCampaignStatus(funnelId: string, status: 'ativa' | 'stopped') {
    if (!funnelId) {
        throw new Error("ID do Funil (Campanha) é obrigatório.");
    }

    const funnelDocRef = doc(db, 'uploads', funnelId);

    try {
        if (status === 'ativa') {
            await updateDoc(funnelDocRef, { campaignStatus: 'running' });
            runCampaignWorker({ campaignId: funnelId });
        } else { // 'stopped'
            await updateDoc(funnelDocRef, { campaignStatus: 'stopping' });
        }

        revalidatePath('/dashboard');
        revalidatePath(`/funnel/${funnelId}`);

        return { success: true, message: `Campaign action '${status}' initiated.` };

    } catch (error: any) {
        console.error(`Error updating campaign status to ${status}:`, error);
        await updateDoc(funnelDocRef, { campaignStatus: 'failed', error_message: error.message });
        throw new Error(error.message);
    }
}

export async function getFunnelCampaignDetails(funnelId: string): Promise<{ name: string; status: string; total_contacts: number; contacts_done: number; contacts_failed: number }> {
    if (!funnelId) {
        throw new Error("Funnel ID é obrigatório.");
    }

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        const funnelDocSnap = await getDoc(funnelDocRef);

        if (!funnelDocSnap.exists()) {
            throw new Error(`Funil com ID ${funnelId} não encontrado.`);
        }

        const data = funnelDocSnap.data();

        const plans = await getOutreachPlans(funnelId);
        let sent = 0;
        let failed = 0;

        if (plans.data) {
            for (const plan of plans.data) {
                if (plan.planData) {
                    for (const item of plan.planData) {
                        if (item.status === 'Contatado') sent++;
                        if (item.status === 'Falhou') failed++;
                    }
                }
            }
        }

        return {
            name: data.fileName || "Campanha sem nome",
            status: data.campaignStatus || "stopped",
            total_contacts: data.recordCount || 0,
            contacts_done: sent,
            contacts_failed: failed,
        };

    } catch (error: any) {
        console.error("Error fetching campaign details:", error);
        throw error;
    }
}

export async function getFunnelCampaignLogs(funnelId: string) {
    if (!funnelId) {
        return [];
    }
    try {
        const logsRef = collection(db, 'uploads', funnelId, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const logData = doc.data();
            const timestamp = logData.timestamp;
            return {
                created_at: timestamp && typeof timestamp.toDate === 'function'
                    ? timestamp.toDate().toISOString()
                    : new Date().toISOString(),
                event_type: logData.level || 'INFO',
                message: logData.message || 'Log message is empty.'
            };
        });

    } catch (error) {
        console.error("Error fetching campaign logs:", error);
        return [];
    }
}

export async function getFunnelCampaignContacts(funnelId: string) {
    if (!funnelId) {
        return [];
    }
    try {
        const contactsRef = collection(db, 'uploads', funnelId, 'records');
        const querySnapshot = await getDocs(contactsRef);

        const plans = await getOutreachPlans(funnelId);
        const planItemsMap = new Map();

        if (plans.data.length > 0) {
            for (const plan of plans.data) {
                if (plan.planData) {
                    for (const item of plan.planData) {
                        if (!planItemsMap.has(item.leadId)) {
                            planItemsMap.set(item.leadId, item.status);
                        }
                    }
                }
            }
        }

        return querySnapshot.docs.map(doc => {
            const contactData = doc.data();
            const leadId = doc.id;
            const messageStatus = planItemsMap.get(leadId) || 'Pendente';

            return {
                id: leadId,
                name: contactData.title || contactData.name,
                phone: contactData.phone,
                status: messageStatus
            };
        });

    } catch (error) {
        console.error("Error fetching campaign contacts:", error);
        return [];
    }
}

/**
 * Feature 8: Duplicate a funnel with its configuration (but NOT leads).
 */
export async function duplicateFunnel(funnelId: string): Promise<{ id: string; name: string }> {
    if (!funnelId) throw new Error('Funnel ID é obrigatório.');

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        const funnelDocSnap = await getDoc(funnelDocRef);
        if (!funnelDocSnap.exists()) throw new Error('Funil original não encontrado.');

        const original = funnelDocSnap.data();
        const newName = `${original.fileName || 'Funil'} (cópia)`;

        const newFunnelRef = await addDoc(collection(db, 'uploads'), {
            fileName: newName,
            createdAt: serverTimestamp(),
            recordCount: 0,
            ownerId: original.ownerId || '',
            ownerEmail: original.ownerEmail || '',
            isEmpty: true,
            stages: original.stages || [],
            customPrompt: original.customPrompt || null,
            campaignStatus: 'stopped',
            campaignStats: { sent: 0, failed: 0 },
            // Copy messaging config
            evolutionInstanceName: original.evolutionInstanceName || null,
            messagingInstanceName: original.messagingInstanceName || null,
            messagingProvider: original.messagingProvider || null,
        });

        return { id: newFunnelRef.id, name: newName };
    } catch (error: any) {
        console.error('Error duplicating funnel:', error);
        throw new Error(error.message || 'Não foi possível duplicar o funil.');
    }
}

/**
 * Feature 5: Get campaign health stats for a specific funnel.
 */
export async function getCampaignHealthStats(funnelId: string): Promise<{
    status: string;
    sent: number;
    failed: number;
    pending: number;
    total: number;
    provider: string | null;
}> {
    if (!funnelId) throw new Error('Funnel ID é obrigatório.');

    try {
        const funnelDocRef = doc(db, 'uploads', funnelId);
        const funnelDocSnap = await getDoc(funnelDocRef);
        if (!funnelDocSnap.exists()) throw new Error('Funil não encontrado.');

        const data = funnelDocSnap.data();
        const plans = await getOutreachPlans(funnelId);

        let sent = 0, failed = 0, pending = 0;
        if (plans.data) {
            for (const plan of plans.data) {
                if (plan.planData) {
                    for (const item of plan.planData) {
                        if (item.status === 'Contatado') sent++;
                        else if (item.status === 'Falhou') failed++;
                        else pending++;
                    }
                }
            }
        }

        return {
            status: data.campaignStatus || 'stopped',
            sent,
            failed,
            pending,
            total: data.recordCount || 0,
            provider: data.messagingProvider || null,
        };
    } catch (error: any) {
        console.error('Error getting campaign health:', error);
        return { status: 'unknown', sent: 0, failed: 0, pending: 0, total: 0, provider: null };
    }
}

/**
 * Feature 6: Set fallback messaging instance for a funnel.
 */
export async function setFunnelFallbackInstance(
    funnelId: string,
    fallbackInstanceName: string | null,
    fallbackProvider: ProviderType | null
) {
    if (!funnelId) throw new Error('Funnel ID é obrigatório.');

    const funnelDocRef = doc(db, 'uploads', funnelId);
    await updateDoc(funnelDocRef, {
        fallbackInstanceName: fallbackInstanceName,
        fallbackProvider: fallbackProvider,
    });
}

/**
 * Feature 7: Deactivate User Account (Auth and Docs)
 */
export async function deactivateUserAccount(uid: string) {
    if (!uid) throw new Error('User ID is required.');
    try {
        if (adminAuth) {
            await adminAuth.updateUser(uid, { disabled: true });
        }

        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            status: 'desativado',
            deactivatedAt: serverTimestamp()
        });

        const deletionsRef = collection(db, 'accountDeletions');
        await addDoc(deletionsRef, {
            uid,
            deletedAt: serverTimestamp(),
            reason: 'User requested account deletion via profile page'
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error deactivating user account:', error);
        return { success: false, error: error.message };
    }
}
