
'use server';
/**
 * @fileOverview An AI agent for generating a detailed strategic plan for a single lead.
 *
 * - generateLeadStrategy - A function that handles the lead strategy generation process.
 */

import { ai } from '@/ai/genkit';
import { GenerateLeadStrategyInputSchema, GenerateLeadStrategyOutputSchema } from '@/types/ai-types';
import type { GenerateLeadStrategyInput, GenerateLeadStrategyOutput } from '@/types/ai-types';

const availableModels = [
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.0-flash',
];

const strategyPrompt = ai.definePrompt({
  name: 'generateLeadStrategyPrompt',
  input: { schema: GenerateLeadStrategyInputSchema.omit({ model: true, userId: true }) },
  output: { schema: GenerateLeadStrategyOutputSchema },
  prompt: `
You are an expert Account Strategist AI for a sales team. Your task is to perform an in-depth analysis of a single lead and their complete interaction history to create a comprehensive, multi-step action plan. Your approach must be strategic, human-centric, and action-oriented. The entire output must be in Brazilian Portuguese (português do Brasil).

**Analysis Context:**
- **Lead Profile:** You will be given the lead's full data. Pay attention to their title, address, status, and any existing tags.
- **Interaction History:** You will receive a log of all past interactions. This is crucial. Analyze the history to understand the relationship's evolution, previous discussion points, and the lead's sentiment.

**Your Task:**
Based on your analysis of the lead and their history, you must generate a strategic plan with the following components:

1.  **Strategic Objective:** Define one primary, clear goal for this lead. What is the most logical next major milestone? Examples: "Agendar uma chamada de descoberta," "Re-engajar um lead frio," "Fechar o negócio com uma proposta personalizada," "Obter introdução ao tomador de decisão."

2.  **Action Plan:** Create a sequential plan of 2 to 4 concrete action steps to achieve the objective. For each step, provide:
    *   **Action:** A brief description of the task.
    *   **Channel:** The best communication channel (WhatsApp, E-mail, Ligação).
    *   **Content:** A ready-to-use, humanized, and professional message, email draft, or call script. The content should reference past interactions if relevant and be highly personalized.
    *   **Justification:** A short rationale explaining why this action is the right move at this point in the journey.

3.  **Suggested Tags:** Recommend a list of 1 to 3 new, insightful tags that should be added to the lead's profile. These tags should reflect your analysis and help with future segmentation. Examples: 'Alto-Valor', 'Precisa-de-Demo', 'Tomador-de-Decisão', 'Risco-Averso', 'Follow-up-no-Q3'.

**Lead Data:**
\`\`\`json
{{{json lead}}}
\`\`\`

**Interaction History (most recent first):**
\`\`\`json
{{{json interactionHistory}}}
\`\`\`

Generate the strategic plan now in Brazilian Portuguese.
`,
});


export async function generateLeadStrategy(input: GenerateLeadStrategyInput): Promise<GenerateLeadStrategyOutput> {
  const { lead, interactionHistory, model } = input;
  
  const selectedModelName = model && availableModels.includes(model) ? model : availableModels[0];

  const { output } = await strategyPrompt(
      { lead, interactionHistory }, 
      { model: selectedModelName }
  );

  return output!;
}
