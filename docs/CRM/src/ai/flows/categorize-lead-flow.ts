
'use server';
/**
 * @fileOverview An AI agent for categorizing a lead based on its data.
 *
 * - categorizeLead - A function that handles the lead categorization process.
 */

import { ai } from '@/ai/genkit';
import { CategorizeLeadInputSchema, CategorizeLeadOutputSchema } from '@/types/ai-types';
import type { CategorizeLeadInput, CategorizeLeadOutput } from '@/types/ai-types';

const availableModels = [
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.0-flash',
];

const categorizePrompt = ai.definePrompt({
  name: 'categorizeLeadPrompt',
  input: { schema: CategorizeLeadInputSchema.omit({ model: true, userId: true }) },
  output: { schema: CategorizeLeadOutputSchema },
  prompt: `
You are a highly efficient data analyst. Your task is to analyze the provided JSON data for a single lead and determine its business category.

Based on fields like 'title', 'name', 'description', or any other relevant information, identify the most accurate and useful business categories for this lead.

Provide 1 to 3 concise category tags. The tags must be in Brazilian Portuguese (português do Brasil).

**Lead Data:**
\`\`\`json
{{{json leadData}}}
\`\`\`

Generate the category tags now.
`,
  config: {
    temperature: 0.3,
  }
});


export async function categorizeLead(input: CategorizeLeadInput): Promise<CategorizeLeadOutput> {
  const { leadData, model } = input;

  const selectedModelName = model && availableModels.includes(model) ? model : availableModels[0]; 

  const { output } = await categorizePrompt(
    { leadData }, 
    { model: selectedModelName }
  );

  return output!;
}
