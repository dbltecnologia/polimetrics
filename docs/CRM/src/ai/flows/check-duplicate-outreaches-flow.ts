
'use server';
/**
 * @fileOverview An AI agent for checking for duplicate outreach attempts and generating new plans.
 * This flow is designed to be asynchronous and includes a locking mechanism to prevent concurrent runs.
 */

import { generateOutreachList } from '@/ai/flows/generate-outreach-list-flow';
import { getFunnels, getQualifiableLeads, saveOutreachPlan, updateLeadsStatus, getLeadsWithRecentOutreach, saveAnalysisReport, updateAnalysisReport, createAnalysisReport, fetchLeadsFromFunnel } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Lead } from '@/types/ai-types';


interface CheckResult {
    funnelId: string;
    funnelName: string;
    analyzedCount: number;
    duplicatesIgnored: number;
    newPlanCreatedFor: number;
}

async function acquireLock(userId: string): Promise<boolean> {
    const lockRef = doc(db, 'users', userId, 'status', 'analysisLock');
    const lockSnap = await getDoc(lockRef);
    if (lockSnap.exists()) {
        const lockData = lockSnap.data();
        // Se o lock tiver mais de 15 minutos, considere-o "travado" e permita uma nova execução.
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        if (lockData.startedAt && lockData.startedAt.toMillis() < fifteenMinutesAgo) {
            await setDoc(lockRef, { status: 'running', startedAt: serverTimestamp() });
            return true;
        }
        return false; 
    }
    await setDoc(lockRef, { status: 'running', startedAt: serverTimestamp() });
    return true;
}

async function releaseLock(userId: string) {
    const lockRef = doc(db, 'users', userId, 'status', 'analysisLock');
    await deleteDoc(lockRef);
}


export async function checkAndGenerateOutreach(userId: string): Promise<{ success: boolean; results: CheckResult[] }> {
    if (!userId) {
        throw new Error('User ID is required.');
    }

    const hasLock = await acquireLock(userId);
    if (!hasLock) {
        throw new Error('An analysis is already in progress. Please wait for it to complete.');
    }

    const reportId = await createAnalysisReport(userId); // Create report immediately with "Running" status

    const allResults: CheckResult[] = [];
    let funnelsProcessed = 0;
    let totalIgnored = 0;
    let totalCreated = 0;

    try {
        const { data: funnels } = await getFunnels(userId);
        if (!funnels || funnels.length === 0) {
            await updateAnalysisReport(userId, reportId, { funnelsProcessed: 0, totalIgnored: 0, totalCreated: 0 }, [], 'Completed');
            return { success: true, results: [] };
        }

        funnelsProcessed = funnels.length;
        
        // Pre-fetch all leads from all funnels to create a global phone number map
        const allFunnelsLeads: { [funnelId: string]: Lead[] } = {};
        for (const funnel of funnels) {
            const leads = await getQualifiableLeads(funnel.id, userId); // Fetch only qualifiable leads to save reads
            allFunnelsLeads[funnel.id] = leads;
        }

        for (const funnel of funnels) {
            const funnelId = funnel.id;
            const funnelName = funnel.name;
            
            const allQualifiableLeads = allFunnelsLeads[funnelId] || [];

            if (allQualifiableLeads.length === 0) {
                allResults.push({ funnelId, funnelName, analyzedCount: 0, duplicatesIgnored: 0, newPlanCreatedFor: 0 });
                continue;
            }

            // --- Enhanced Duplicate Check ---
            // 1. Check for recently contacted within the same funnel
            const recentlyContactedLeadIds = await getLeadsWithRecentOutreach(funnelId, 14);

            // 2. Build a set of all phone numbers from OTHER funnels
            const otherFunnelsPhones = new Set<string>();
            for (const otherFunnel of funnels) {
                if (otherFunnel.id !== funnelId) {
                    // We need all leads from other funnels for phone comparison, not just qualifiable ones
                    const otherFunnelAllLeads = await fetchLeadsFromFunnel(otherFunnel.id);
                    otherFunnelAllLeads?.forEach(lead => {
                        if (lead.phone) {
                            const normalizedPhone = lead.phone.replace(/\D/g, '');
                            if (normalizedPhone) {
                                otherFunnelsPhones.add(normalizedPhone);
                            }
                        }
                    });
                }
            }
            
            const leadsToProcess = allQualifiableLeads.filter(lead => {
                if (recentlyContactedLeadIds.has(lead.id)) return false;
                if (lead.phone) {
                    const normalizedPhone = lead.phone.replace(/\D/g, '');
                    if (normalizedPhone && otherFunnelsPhones.has(normalizedPhone)) {
                        return false;
                    }
                }
                return true;
            });
            
            const duplicatesCount = allQualifiableLeads.length - leadsToProcess.length;
            totalIgnored += duplicatesCount;

            if (leadsToProcess.length === 0) {
                 allResults.push({ funnelId, funnelName, analyzedCount: allQualifiableLeads.length, duplicatesIgnored: duplicatesCount, newPlanCreatedFor: 0 });
                continue;
            }
            
            const { outreachList } = await generateOutreachList({
                leads: leadsToProcess.slice(0, 50),
                model: 'gemini-pro',
                userId: userId,
            });

            let newPlanCount = 0;
            if (outreachList && outreachList.length > 0) {
                await saveOutreachPlan(funnelId, outreachList);
                const processedLeadIds = outreachList.map(item => item.leadId);
                await updateLeadsStatus(funnelId, processedLeadIds, 'Em Pesquisa');
                newPlanCount = outreachList.length;
                totalCreated += newPlanCount;
            }

            allResults.push({
                funnelId,
                funnelName,
                analyzedCount: allQualifiableLeads.length,
                duplicatesIgnored: duplicatesCount,
                newPlanCreatedFor: newPlanCount,
            });
        }
        
        await updateAnalysisReport(userId, reportId, { funnelsProcessed, totalIgnored, totalCreated }, allResults, 'Completed');
        return { success: true, results: allResults };

    } catch (error: any) {
        console.error("Error in checkAndGenerateOutreach flow:", error);
        await updateAnalysisReport(userId, reportId, { funnelsProcessed, totalIgnored, totalCreated }, allResults, 'Failed', error.message);
        throw new Error(error.message || "An unexpected error occurred while checking for duplicates.");
    } finally {
        await releaseLock(userId);
    }
}
