// src/ai/flows/compare-funnels-flow.ts
'use server';
/**
 * @fileOverview A flow for comparing two funnels to find duplicate or recently contacted leads.
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Lead } from '@/types/ai-types';
import { getLeadsWithRecentOutreach, fetchLeadsFromFunnel } from '@/lib/actions';

interface CompareFunnelsInput {
    sourceFunnelId: string;
    targetFunnelId: string;
    contactWindowDays: number;
}

export interface ConflictLeadResult {
    targetLead: Lead;
    sourceLead: Lead | null;
    reasons: ('duplicate' | 'recent_contact')[];
}

interface CompareFunnelsOutput {
    conflicts: ConflictLeadResult[];
}

export async function compareFunnelsForConflicts(input: CompareFunnelsInput): Promise<CompareFunnelsOutput> {
    const { sourceFunnelId, targetFunnelId, contactWindowDays } = input;

    if (!sourceFunnelId || !targetFunnelId) {
        throw new Error('Both source and target funnel IDs are required.');
    }

    try {
        // Fetch all leads from both funnels and recent contacts concurrently
        const [sourceLeads, targetLeads, recentlyContactedInTarget] = await Promise.all([
            fetchLeadsFromFunnel(sourceFunnelId),
            fetchLeadsFromFunnel(targetFunnelId),
            getLeadsWithRecentOutreach(targetFunnelId, contactWindowDays)
        ]);

        const sourceLeadsByPhone = new Map<string, Lead>();
        sourceLeads.forEach(lead => {
            if (lead.phone) {
                const normalizedPhone = lead.phone.replace(/\D/g, '');
                if (normalizedPhone) {
                    sourceLeadsByPhone.set(normalizedPhone, lead);
                }
            }
        });
        
        const conflictsMap = new Map<string, ConflictLeadResult>();

        // Process all leads in the target funnel
        targetLeads.forEach(targetLead => {
            let conflictReasons: ('duplicate' | 'recent_contact')[] = [];
            let sourceLead: Lead | null = null;

            // Check for duplicate phone number
            if (targetLead.phone) {
                const normalizedPhone = targetLead.phone.replace(/\D/g, '');
                if (normalizedPhone && sourceLeadsByPhone.has(normalizedPhone)) {
                    conflictReasons.push('duplicate');
                    sourceLead = sourceLeadsByPhone.get(normalizedPhone)!;
                }
            }

            // Check for recent contact
            if (recentlyContactedInTarget.has(targetLead.id)) {
                conflictReasons.push('recent_contact');
            }

            // If there's any conflict, add it to the map
            if (conflictReasons.length > 0) {
                conflictsMap.set(targetLead.id, {
                    targetLead,
                    sourceLead, // Will be null if only recent_contact is the reason
                    reasons: conflictReasons,
                });
            }
        });

        return { conflicts: Array.from(conflictsMap.values()) };

    } catch (error: any) {
        console.error("Error comparing funnels:", error);
        throw new Error(error.message || 'An unexpected error occurred during the funnel comparison.');
    }
}
