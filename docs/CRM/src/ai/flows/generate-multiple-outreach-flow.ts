
'use server';
/**
 * @fileOverview An AI agent for generating outreach plans for all funnels of a user.
 */

import { generateOutreachList } from '@/ai/flows/generate-outreach-list-flow';
import { getFunnels, getQualifiableLeads, saveOutreachPlan, updateLeadsStatus } from '@/lib/actions';

export async function generateOutreachPlansForAllFunnelsAI(userId: string) {
    if (!userId) {
        throw new Error('User ID is required.');
    }

    try {
        const { data: funnels } = await getFunnels(userId);
        if (!funnels || funnels.length === 0) {
            throw new Error('Nenhum funil encontrado para este usuário.');
        }

        let totalPlansCreated = 0;
        const totalFunnelsProcessed = funnels.length;

        for (const funnel of funnels) {
            const funnelId = funnel.id;
            
            // 1. Get up to 10 qualifiable leads from the database actions
            const leadsToProcess = await getQualifiableLeads(funnelId, userId).then(leads => leads.slice(0, 10));

            if (leadsToProcess.length === 0) {
                console.log(`Skipping funnel ${funnel.name}: No new leads.`);
                continue;
            }
            
            // 2. We are not using custom prompts in this mass-generation flow for simplicity.
            
            // 3. Generate the outreach list using the existing AI flow
            const { outreachList } = await generateOutreachList({
                leads: leadsToProcess,
                model: 'gemini-pro',
                userId: userId,
            });

            if (outreachList && outreachList.length > 0) {
                // 4. Save the new plan using database actions
                await saveOutreachPlan(funnelId, outreachList);

                // 5. Update the status of the processed leads using database actions
                const processedLeadIds = outreachList.map(item => item.leadId);
                await updateLeadsStatus(funnelId, processedLeadIds, 'Em Pesquisa');
                totalPlansCreated++;
            }
        }
        
        return { success: true, totalFunnelsProcessed, totalPlansCreated };

    } catch (error: any) {
        console.error("Error in generateOutreachPlansForAllFunnelsAI flow:", error);
        throw new Error(error.message || "An unexpected error occurred while generating outreach plans.");
    }
}
