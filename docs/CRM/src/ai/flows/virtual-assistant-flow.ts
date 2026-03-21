
// src/ai/flows/virtual-assistant-flow.ts
'use server';
/**
 * @fileOverview An AI agent that acts as a virtual assistant for the platform.
 *
 * - askVirtualAssistant - A function that handles answering user questions about the platform.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { GenerateResponse } from 'genkit';
import { AssistantInputSchema } from '@/types/ai-types';
import type { AssistantInput } from '@/types/ai-types';

type HistoryMessage = z.infer<typeof AssistantInputSchema>['history'];

function formatHistory(history: HistoryMessage): string {
  if (!history || history.length === 0) return 'Nenhum histórico de conversa.';
  return history.map(message => {
    return `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content || ''}`;
  }).join('\n');
}

export async function askVirtualAssistant(input: AssistantInput): Promise<{ answer: string }> {
  const { question, history = [], model } = input;

  try {
    const selectedModelName = model || 'googleai/gemini-2.5-flash';
    
    const formattedHistory = formatHistory(history);

    const finalPrompt = `
      You are "Agenticx", a friendly and helpful virtual assistant for a CRM platform.
      Your personality is professional, concise, and direct.
      You MUST answer in Brazilian Portuguese (português do Brasil).
      Your goal is to answer user questions about how to use the platform.
      If you don't know the answer, say "Desculpe, não tenho informações sobre isso."

      CONVERSATION HISTORY:
      ---
      ${formattedHistory}
      ---

      NEW QUESTION:
      User: ${question}
      Assistant:
    `;

    const response: GenerateResponse<any> = await ai.generate({
      model: selectedModelName,
      prompt: finalPrompt,
      config: {
        temperature: 0.2,
        safetySettings: [
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE',
            },
        ]
      },
    });
    
    const outputText = response.text;

    if (!outputText) {
      const finishReason = response.finishReason || 'unknown';
      console.warn(`AI returned null or empty output. Finish Reason: ${finishReason}.`);
      throw new Error(`AI returned an empty response. Finish Reason: ${finishReason}.`);
    }

    return { answer: outputText };

  } catch (error: any) {
    console.error("Error in askVirtualAssistant flow:", error);
    // Rethrow the original error message to be displayed in the client toast
    throw new Error(error.message || 'An unknown error occurred while communicating with the AI.');
  }
}
