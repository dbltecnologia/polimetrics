import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Helper to find which tenant (user) this Chatwoot account belongs to
async function findTenantByAccountId(accountId: string) {
    const instancesRef = collection(db, 'messagingInstances');
    const q = query(
        instancesRef,
        where('provider', '==', 'chatwoot'),
        where('config.accountId', '==', accountId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
        instanceId: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    };
}

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // Chatwoot webhooks always send the account object
        const accountId = payload?.account?.id?.toString();
        const eventType = payload?.event;

        if (!accountId || !eventType) {
            return NextResponse.json({ error: 'Payload inválido ou incompleto' }, { status: 400 });
        }

        // 1. Identify the Tenant
        const tenantInstance = await findTenantByAccountId(accountId);

        if (!tenantInstance) {
            console.warn(`Webhook recebido para AccountID desconhecido: ${accountId}`);
            return NextResponse.json({ error: 'Instância não alocada a nenhum tenant' }, { status: 404 });
        }

        const ownerId = (tenantInstance as any).ownerId;

        console.log(`[WEBHOOK Chatwoot] Evento do tipo '${eventType}' recebido para tenant '${ownerId}' (Account: ${accountId})`);

        // 2. Route the Event
        switch (eventType) {
            case 'contact_created':
            case 'contact_updated':
                await handleContactSync(payload, ownerId);
                break;

            case 'conversation_status_changed':
            case 'conversation_updated':
                await handleFunnelSync(payload, ownerId);
                break;

            case 'message_created':
                await handleMessageTriage(payload, ownerId, tenantInstance);
                break;

            default:
                console.log(`Evento ${eventType} ignorado.`);
                break;
        }

        return NextResponse.json({ success: true, message: 'Webhook processado' });

    } catch (error: any) {
        console.error('Erro no processamento do Webhook:', error);
        return NextResponse.json({ error: 'Erro interno no servidor', details: error.message }, { status: 500 });
    }
}

// ==========================================
// EVENT HANDLERS (To be implemented)
// ==========================================

async function handleContactSync(payload: any, ownerId: string) {
    const contactName = payload?.name;
    const contactPhone = payload?.phone_number;
    const contactEmail = payload?.email;

    if (!contactPhone || !contactName) {
        console.log(`[ContactSync] Ignorando contato sem telefone ou nome:`, payload);
        return;
    }

    // contacts are currently stored inside an `uploadId` (Funnel) 
    // we need to find the active "funnel" for this user.
    // Let's get the latest funnel for this owner.
    const uploadsRef = collection(db, 'uploads');
    const qUploads = query(uploadsRef, where('ownerId', '==', ownerId));
    const uploadsSnap = await getDocs(qUploads);

    if (uploadsSnap.empty) {
        console.log(`[ContactSync] Tenant ${ownerId} não possui funis (uploads). Ignorando sync.`);
        return;
    }

    // For simplicity, we sync to the first/latest funnel. 
    // In a multi-funnel setup, we might need a default CRM contact list.
    const uploadId = uploadsSnap.docs[0].id;
    const contactsRef = collection(db, 'uploads', uploadId, 'contacts');

    // Check if contact already exists by phone
    // Chatwoot phones usually have +55...
    const qContact = query(contactsRef, where('phone', '==', contactPhone));
    const contactSnap = await getDocs(qContact);

    if (!contactSnap.empty) {
        // Update existing contact
        const contactDoc = contactSnap.docs[0];
        await updateDoc(contactDoc.ref, {
            name: contactName,
            email: contactEmail || contactDoc.data().email || '',
        });
        console.log(`[ContactSync] Contato atualizado: ${contactName} (${contactPhone})`);
    } else {
        // Create new contact
        await addDoc(contactsRef, {
            name: contactName,
            phone: contactPhone,
            email: contactEmail || '',
            createdAt: serverTimestamp()
        });
        console.log(`[ContactSync] Novo contato criado: ${contactName} (${contactPhone}) no funil ${uploadId}`);
    }
}

async function handleFunnelSync(payload: any, ownerId: string) {
    const conversationStatus = payload?.status;
    const contactPhone = payload?.meta?.sender?.phone_number;

    if (!conversationStatus || !contactPhone) {
        return;
    }

    // Example logic: If Chatwoot conversation is "resolved", mark Lead as "Ganhamos" OR "Resolvido"
    // To do this properly, we need to find the Lead associated with this phone number.

    // In our CRM, a "Lead" is inside `uploads/{uploadId}/leads`
    // First find the upload funnels for this user.
    if (conversationStatus === 'resolved') {
        const uploadsRef = collection(db, 'uploads');
        const qUploads = query(uploadsRef, where('ownerId', '==', ownerId));
        const uploadsSnap = await getDocs(qUploads);

        let leadFound = false;

        for (const upDoc of uploadsSnap.docs) {
            const uploadId = upDoc.id;
            const leadsRef = collection(db, 'uploads', uploadId, 'leads');
            const qLeads = query(leadsRef, where('phone', '==', contactPhone));
            const leadsSnap = await getDocs(qLeads);

            if (!leadsSnap.empty) {
                // Update the lead status
                const leadDoc = leadsSnap.docs[0];
                await updateDoc(leadDoc.ref, {
                    statusFunil: 'Ganhamos' // Example transition
                });
                console.log(`[FunnelSync] Lead ${contactPhone} atualizado para 'Ganhamos' no funil ${uploadId}`);
                leadFound = true;
                break; // Stop searching if found
            }
        }

        if (!leadFound) {
            console.log(`[FunnelSync] Nenhum Lead ativo encontrado para o telefone ${contactPhone} ao resolver conversa.`);
        }
    }
}

import { triageLeadBotFlow } from '@/ai/flows/triage-lead-bot-flow';

async function handleMessageTriage(payload: any, ownerId: string, instance: any) {
    // We only care about user incoming messages, not agent replies
    if (payload?.message_type !== 'incoming') {
        return;
    }

    // Check if message is private note or not fully loaded
    if (payload?.private) return;

    const messageContent = payload?.content;
    const sender = payload?.sender;
    const conversationId = payload?.conversation?.id;
    const accountId = payload?.account?.id;

    if (!messageContent || !conversationId) return;

    console.log(`-> Triagem Genkit para tenant ${ownerId} acionada por mensagem gatinho: "${messageContent}" do remetente ${sender?.name}`);

    try {
        const aiResult = await triageLeadBotFlow({
            messageContent: messageContent,
            contactName: sender?.name || '',
            companyContext: instance?.name ? `A empresa se chama ${instance.name}.` : '',
        });

        console.log(`[MessageTriage] Genkit Bot: A categoria foi '${aiResult.category}'. Precisava de humano? ${aiResult.needsHuman}`);

        // If the AI says we don't need a human, we reply automatically!
        if (!aiResult.needsHuman && aiResult.suggestedResponse && instance.config) {

            const chatwootToken = instance.config.apiAccessToken;
            const chatwootBaseUrl = instance.config.baseUrl;

            if (chatwootToken && chatwootBaseUrl) {
                const messageUrl = `${chatwootBaseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

                await fetch(messageUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
                    body: JSON.stringify({
                        content: aiResult.suggestedResponse,
                        message_type: 'outgoing', // Chatwoot API expects outgoing for agent/bot replies
                    }),
                });

                console.log(`[MessageTriage] Bot Auto-Respondeu: "${aiResult.suggestedResponse}"`);
            }
        }

    } catch (error) {
        console.error(`[MessageTriage] Erro na requisição ao Genkit:`, error);
    }
}
