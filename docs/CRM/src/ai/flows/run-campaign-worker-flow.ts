
'use server';
/**
 * @fileOverview A Genkit flow that acts as a worker to run a WhatsApp outreach campaign.
 * This flow is the main orchestrator, fetching plans from the CRM, sending messages, and updating the CRM status.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDoc, doc, updateDoc, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setTimeout } from 'timers/promises';
import { getOutreachPlans, updateOutreachPlanItem, addInteractionToLead, updateLeadsStatus } from '@/lib/actions';
import { getProvider, buildProviderConfig, PROVIDER_LABELS } from '@/lib/messaging';
import type { ProviderType, ProviderConfig } from '@/lib/messaging';
import type { OutreachItem } from '@/types/ai-types';

// --- Helper Functions ---

// Function to log messages to Firestore for a specific campaign
async function logToFirestore(funnelId: string, message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' = 'INFO') {
    try {
        const logData = {
            timestamp: serverTimestamp(),
            message: message,
            level: level
        };
        const logsCollectionRef = collection(db, 'uploads', funnelId, 'logs');
        await addDoc(logsCollectionRef, logData);
        console.log(`[${level}] ${message}`);
    } catch (error) {
        console.error(`Failed to write log to Firestore: ${message}`, error);
    }
}

// Function to send a message using the multi-provider abstraction layer
async function sendMessage(
    phone: string,
    message: string,
    providerType: ProviderType,
    providerConfig: ProviderConfig,
    funnelId: string
) {
    const providerLabel = PROVIDER_LABELS[providerType] || providerType;
    const provider = getProvider(providerType);

    // Log the request details before sending
    await logToFirestore(funnelId, `Sending via ${providerLabel}: phone=${phone}`, "INFO");

    try {
        const result = await provider.sendText(phone, message, providerConfig);
        if (!result.success) {
            return { success: false, detail: result.detail };
        }
        return { success: true, detail: `Message sent via ${providerLabel}.` };
    } catch (e: any) {
        return { success: false, detail: e.message || `Unknown error during ${providerLabel} call.` };
    }
}


// --- Main Worker Flow ---

const RunCampaignWorkerInputSchema = z.object({
    campaignId: z.string(),
});

export const runCampaignWorker = ai.defineFlow(
    {
        name: 'runCampaignWorkerFlow',
        inputSchema: RunCampaignWorkerInputSchema,
        outputSchema: z.void(),
    },
    async ({ campaignId }) => { // campaignId is our funnelId

        await logToFirestore(campaignId, `--- Starting Worker for Campaign: ${campaignId} ---`);
        const funnelRef = doc(db, 'uploads', campaignId);

        try {
            const funnelDoc = await getDoc(funnelRef);
            if (!funnelDoc.exists()) {
                await logToFirestore(campaignId, "Funnel not found. Exiting.", "ERROR");
                return;
            }

            const funnelData = funnelDoc.data();

            // Determine messaging provider — backward compat with Evolution-only field
            const providerType: ProviderType = funnelData.messagingProvider || 'evolution';
            const instanceName = funnelData.messagingInstanceName || funnelData.evolutionInstanceName;
            const providerLabel = PROVIDER_LABELS[providerType] || providerType;

            if (!instanceName) {
                throw new Error(`Messaging instance is not configured for this funnel. Configure via Funnel Settings.`);
            }

            // Load provider-specific config from the messaging instance in Firestore
            let instanceConfig: Record<string, any> | undefined;
            try {
                const { getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
                // Try new collection first
                let configQuery = query(collection(db, 'messagingInstances'), where('name', '==', instanceName), orderBy('createdAt', 'desc'), limit(1));
                let configSnap = await getDocs(configQuery);
                if (configSnap.empty) {
                    // Fallback to legacy collection
                    configQuery = query(collection(db, 'evolutionInstances'), where('name', '==', instanceName), orderBy('createdAt', 'desc'), limit(1));
                    configSnap = await getDocs(configQuery);
                }
                if (!configSnap.empty) {
                    instanceConfig = configSnap.docs[0].data().config;
                }
            } catch { /* proceed without instance-specific config */ }

            const providerConfig = buildProviderConfig(providerType, instanceName, instanceConfig);

            // Hardcoded delay values in seconds (5 to 10 minutes)
            const minDelay = 300;
            const maxDelay = 600;

            await logToFirestore(campaignId, `Using instance: '${instanceName}' (${providerLabel})`);

            // 1. Fetch all outreach plans from the CRM
            const plansResponse = await getOutreachPlans(campaignId);

            // 2. Aggregate all items from all plans
            let allPlanItems: (OutreachItem & { planId: string })[] = [];
            if (plansResponse && plansResponse.data) {
                plansResponse.data.forEach((plan: any) => {
                    if (plan.planData && Array.isArray(plan.planData)) {
                        // Add planId to each item for easier updates later
                        const itemsWithPlanId = plan.planData.map((item: OutreachItem) => ({ ...item, planId: plan.id }));
                        allPlanItems.push(...itemsWithPlanId);
                    }
                });
            }

            if (allPlanItems.length === 0) {
                await logToFirestore(campaignId, 'No outreach plan items found. Campaign stopped — create outreach plans first.', 'INFO');
                await updateDoc(funnelRef, { 'campaignStatus': 'stopped' });
                return;
            }

            const pendingItems = allPlanItems.filter((item) => item.status === 'Pendente' && item.phone);

            if (pendingItems.length === 0) {
                await logToFirestore(campaignId, 'All leads in the plan have already been processed. No pending items.', 'INFO');
                await updateDoc(funnelRef, { 'campaignStatus': 'completed', 'finished_at': serverTimestamp() });
                return;
            }

            await logToFirestore(campaignId, `Found ${pendingItems.length} pending leads to process across all plans.`);

            let processedCount = 0;

            for (const item of pendingItems) {
                const currentFunnelSnap = await getDoc(funnelRef);
                if (currentFunnelSnap.data()?.campaignStatus === 'stopping') {
                    await logToFirestore(campaignId, "Stop signal received. Gracefully shutting down.");
                    await updateDoc(funnelRef, { 'campaignStatus': 'stopped' });
                    return;
                }

                const { leadId, leadName, suggestedMessage, phone, planId } = item;

                await logToFirestore(campaignId, `(${processedCount + 1}/${pendingItems.length}) Processing: ${leadName} (${phone})`);

                if (!phone) {
                    await logToFirestore(campaignId, `-> SKIPPED: Lead ${leadName} has no phone number.`, "INFO");
                    continue;
                }

                let cleanPhone = String(phone).replace(/\D/g, '');
                if (!cleanPhone.startsWith('55')) {
                    cleanPhone = '55' + cleanPhone;
                }

                try {
                    // 2. Command the message send to the Whatsapp Server
                    const { success, detail } = await sendMessage(cleanPhone, suggestedMessage, providerType, providerConfig, campaignId);

                    if (!success) {
                        throw new Error(detail); // If sending fails, jump to catch block
                    }

                    await updateDoc(funnelRef, { 'campaignStats.sent': increment(1) });
                    await logToFirestore(campaignId, `-> SUCCESS for ${leadName}. Message sent. Now updating CRM.`, "SUCCESS");

                    // 3. If send was successful, UPDATE THE CRM
                    // 3.1: Update the item in the outreach plan
                    await updateOutreachPlanItem(campaignId, planId, {
                        ...item,
                        status: "Contatado",
                        agentNotes: `Mensagem inicial enviada via ${providerLabel}.`,
                    });

                    // 3.2: Register the interaction in the lead's history
                    await addInteractionToLead(campaignId, leadId, {
                        tipoInteracao: `WhatsApp (Agenticx/${providerLabel})`,
                        resumoInteracao: `Agenticx enviou a mensagem via ${providerLabel}: '${suggestedMessage}'`,
                    });

                    // 3.3: Move the lead in the funnel
                    await updateLeadsStatus(campaignId, [leadId], "Primeiro Contato");

                    await logToFirestore(campaignId, `-> CRM Updated for ${leadName}.`);


                } catch (sendError: any) {
                    // Feature 6: Try fallback provider if configured
                    let fallbackSuccess = false;
                    
                    if (funnelData.fallbackInstanceName && funnelData.fallbackProvider) {
                        const fbProvider = funnelData.fallbackProvider as ProviderType;
                        const fbLabel = PROVIDER_LABELS[fbProvider] || fbProvider;
                        const fbInstanceName = funnelData.fallbackInstanceName;
                        await logToFirestore(campaignId, `-> Primary failed. ERROR: ${sendError.message}. Trying fallback: ${fbLabel} (${fbInstanceName})...`, "INFO");

                        try {
                            // Load fallback instance config
                            let fbInstanceConfig: Record<string, any> | undefined;
                            const { getDocs: getDocs2, query: query2, where: where2, orderBy: orderBy2, limit: limit2 } = await import('firebase/firestore');
                            let fbQuery = query2(collection(db, 'messagingInstances'), where2('name', '==', fbInstanceName), orderBy2('createdAt', 'desc'), limit2(1));
                            let fbSnap = await getDocs2(fbQuery);
                            if (fbSnap.empty) {
                                fbQuery = query2(collection(db, 'evolutionInstances'), where2('name', '==', fbInstanceName), orderBy2('createdAt', 'desc'), limit2(1));
                                fbSnap = await getDocs2(fbQuery);
                            }
                            if (!fbSnap.empty) fbInstanceConfig = fbSnap.docs[0].data().config;

                            const fbConfig = buildProviderConfig(fbProvider, fbInstanceName, fbInstanceConfig);
                            const fbResult = await sendMessage(cleanPhone, suggestedMessage, fbProvider, fbConfig, campaignId);

                            if (fbResult.success) {
                                fallbackSuccess = true;
                                await updateDoc(funnelRef, { 'campaignStats.sent': increment(1) });
                                await logToFirestore(campaignId, `-> FALLBACK SUCCESS for ${leadName} via ${fbLabel}.`, "SUCCESS");

                                await updateOutreachPlanItem(campaignId, planId, {
                                    ...item,
                                    status: "Contatado",
                                    agentNotes: `Enviado via fallback ${fbLabel} (primário ${providerLabel} falhou).`,
                                });
                                await addInteractionToLead(campaignId, leadId, {
                                    tipoInteracao: `WhatsApp (Agenticx/${fbLabel} - Fallback)`,
                                    resumoInteracao: `Enviado via fallback ${fbLabel}: '${suggestedMessage}'`,
                                });
                                await updateLeadsStatus(campaignId, [leadId], "Primeiro Contato");
                            } else {
                                await logToFirestore(campaignId, `-> FALLBACK also failed for ${leadName}: ${fbResult.detail}`, "ERROR");
                            }
                        } catch (fbError: any) {
                            await logToFirestore(campaignId, `-> FALLBACK ERROR for ${leadName}: ${fbError.message}`, "ERROR");
                        }
                    }

                    if (!fallbackSuccess) {
                        await updateDoc(funnelRef, { 'campaignStats.failed': increment(1) });
                        await logToFirestore(campaignId, `-> ERROR for ${leadName}: ${sendError.message}`, "ERROR");
                        await updateOutreachPlanItem(campaignId, planId, {
                            ...item,
                            status: "Falhou",
                            agentNotes: `Falha ao enviar via ${providerLabel}: ${sendError.message}`,
                        });
                    }
                }

                processedCount++;

                // Apply delay before next contact
                if (processedCount < pendingItems.length) {
                    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
                    await logToFirestore(campaignId, `Waiting for ${delay} seconds before next message...`, 'INFO');
                    await setTimeout(delay * 1000);
                }
            }

            await updateDoc(funnelRef, { 'campaignStatus': 'completed', 'finished_at': serverTimestamp() });
            await logToFirestore(campaignId, "--- Outreach Process Finished ---");

        } catch (e: any) {
            await logToFirestore(campaignId, `A critical error occurred: ${e.message}`, "ERROR");
            await updateDoc(funnelRef, { 'campaignStatus': 'failed', 'error_message': e.message });
            console.error(e);
        }
    }
);
